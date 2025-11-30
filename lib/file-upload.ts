import { supabase, uploadFile, getFileUrl, deleteFile, createSignedUrl, SUPABASE_BUCKET } from './supabase'

export type UploadFileParams = {
    file: File
    ownerId: string
    type: 'PRODUCT_IMAGE' | 'CUSTOMER_DOCUMENT' | 'INVOICE' | 'REPORT_EXPORT' | 'BUSINESS_LOGO'
    relatedId?: string // customerId, productId, saleId, etc.
}

export type FileUploadResult = {
    success: boolean
    fileRecord?: any
    error?: string
    signedUrl?: string
}

export async function uploadAndCreateFileRecord(params: UploadFileParams): Promise<FileUploadResult> {
    const { file, ownerId, type, relatedId } = params

    try {
        // Generate path based on file type
        const path = generateFilePath(type, file.name, ownerId, relatedId)

        // Upload file to your cims-app-files bucket
        const uploadResult = await uploadFile(file, SUPABASE_BUCKET, path)

        // Get the public URL (for private buckets, we'll use signed URLs when needed)
        const fileUrl = getFileUrl(SUPABASE_BUCKET, uploadResult.path)

        // Create signed URL for immediate access
        const signedUrl = await createSignedUrl(SUPABASE_BUCKET, uploadResult.path, 3600) // 1 hour

        // Create file record in database
        const { prisma } = await import('./db')

        const fileRecord = await prisma.file.create({
            data: {
                name: file.name,
                url: fileUrl,
                type: mapFileType(type),
                size: file.size,
                mimeType: file.type,
                ownerId,
                // Set appropriate relation based on type
                ...(type === 'PRODUCT_IMAGE' && relatedId && { productId: relatedId }),
                ...(type === 'CUSTOMER_DOCUMENT' && relatedId && { customerId: relatedId }),
                ...(type === 'INVOICE' && relatedId && { saleId: relatedId }),
                ...(type === 'BUSINESS_LOGO' && { /* No specific relation for logos */ }),
            }
        })

        return {
            success: true,
            fileRecord,
            signedUrl
        }
    } catch (error: any) {
        console.error('File upload failed:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

function generateFilePath(type: UploadFileParams['type'], fileName: string, ownerId: string, relatedId?: string): string {
    const timestamp = Date.now()
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')

    // Organize files in folders by type and owner
    const basePath = `${type.toLowerCase().replace('_', '-')}/${ownerId}`

    switch (type) {
        case 'PRODUCT_IMAGE':
            return `${basePath}/products/${relatedId || 'general'}/${timestamp}-${safeFileName}`
        case 'CUSTOMER_DOCUMENT':
            return `${basePath}/customers/${relatedId || 'general'}/${timestamp}-${safeFileName}`
        case 'INVOICE':
            return `${basePath}/invoices/${relatedId || 'general'}/${timestamp}-${safeFileName}`
        case 'REPORT_EXPORT':
            return `${basePath}/exports/${timestamp}-${safeFileName}`
        case 'BUSINESS_LOGO':
            return `${basePath}/logos/${timestamp}-${safeFileName}`
        default:
            return `${basePath}/misc/${timestamp}-${safeFileName}`
    }
}

function mapFileType(type: UploadFileParams['type']) {
    const mapping = {
        'PRODUCT_IMAGE': 'PRODUCT_IMAGE',
        'CUSTOMER_DOCUMENT': 'CUSTOMER_DOCUMENT',
        'INVOICE': 'INVOICE',
        'REPORT_EXPORT': 'REPORT_EXPORT',
        'BUSINESS_LOGO': 'BUSINESS_LOGO'
    } as const

    return mapping[type]
}

// Get signed URL for private file access
export async function getFileSignedUrl(fileId: string, expiresIn: number = 3600) {
    const { prisma } = await import('./db')

    try {
        const file = await prisma.file.findUnique({
            where: { id: fileId }
        })

        if (!file) {
            throw new Error('File not found')
        }

        // Extract storage path from URL
        const storagePath = extractStoragePath(file.url)

        // Create signed URL
        const signedUrl = await createSignedUrl(SUPABASE_BUCKET, storagePath, expiresIn)

        return signedUrl
    } catch (error: any) {
        console.error('Failed to get signed URL:', error)
        throw error
    }
}

// Delete file from storage and database
export async function deleteFileRecord(fileId: string) {
    const { prisma } = await import('./db')

    try {
        const file = await prisma.file.findUnique({
            where: { id: fileId }
        })

        if (!file) {
            throw new Error('File not found')
        }

        // Extract storage path from URL
        const storagePath = extractStoragePath(file.url)

        // Delete from storage
        await deleteFile(SUPABASE_BUCKET, storagePath)

        // Delete from database
        await prisma.file.delete({
            where: { id: fileId }
        })

        return { success: true }
    } catch (error: any) {
        console.error('File deletion failed:', error)
        return { success: false, error: error.message }
    }
}

// Helper to extract storage path from Supabase URL
function extractStoragePath(url: string): string {
    try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/')

        // For Supabase storage URLs, the path is usually at the end
        // Format: /storage/v1/object/public/[bucket]/path/to/file
        // or: /storage/v1/object/sign/[bucket]/path/to/file?token=...
        const bucketIndex = pathParts.indexOf(SUPABASE_BUCKET)
        if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
            return pathParts.slice(bucketIndex + 1).join('/')
        }

        // Fallback: try to extract from query parameters or last part
        return pathParts.pop() || url.split('/').pop() || 'unknown'
    } catch {
        return url.split('/').pop() || 'unknown'
    }
}

// List files for a specific owner and type
export async function listOwnerFiles(ownerId: string, type?: UploadFileParams['type']) {
    const { prisma } = await import('./db')

    const whereClause: any = { ownerId }
    if (type) {
        whereClause.type = mapFileType(type)
    }

    return await prisma.file.findMany({
        where: whereClause,
        orderBy: { uploadedAt: 'desc' }
    })
}

// Bulk delete files
export async function bulkDeleteFiles(fileIds: string[]) {
    const { prisma } = await import('./db')

    try {
        // Get files to delete
        const files = await prisma.file.findMany({
            where: { id: { in: fileIds } }
        })

        // Delete from storage
        const deletePromises = files.map(file => {
            const storagePath = extractStoragePath(file.url)
            return deleteFile(SUPABASE_BUCKET, storagePath)
        })

        await Promise.all(deletePromises)

        // Delete from database
        await prisma.file.deleteMany({
            where: { id: { in: fileIds } }
        })

        return { success: true, deletedCount: fileIds.length }
    } catch (error: any) {
        console.error('Bulk delete failed:', error)
        return { success: false, error: error.message }
    }
}