// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Use function to get Supabase client to handle missing env vars
export function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
            'Missing Supabase environment variables. Please check your .env file.\n' +
            'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
        )
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

export const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'cims-app-files'

// Re-export for backward compatibility
export const supabase = getSupabase()

// Helper function for file uploads
export const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (error) {
        throw error
    }

    return data
}

// Get public URL (for private buckets, this will require signed URLs)
export const getFileUrl = (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
}

// Create signed URL for private files
export const createSignedUrl = async (bucket: string, path: string, expiresIn: number = 3600) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

    if (error) {
        throw error
    }

    return data.signedUrl
}

// Helper function to delete file
export const deleteFile = async (bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) {
        throw error
    }
}

// Check if bucket exists and is accessible
export const checkBucketAccess = async (bucket: string) => {
    try {
        const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 })
        if (error) {
            if (error.message.includes('Bucket not found')) {
                console.log(`Bucket "${bucket}" not found. Please create it in Supabase Storage first.`)
            }
            throw error
        }
        return true
    } catch (error) {
        console.error(`Bucket ${bucket} access check failed:`, error)
        return false
    }
}

// List files in a folder
export const listFiles = async (bucket: string, folderPath: string = '') => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .list(folderPath)

    if (error) throw error
    return data
}

// Download file
export const downloadFile = async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .download(path)

    if (error) throw error
    return data
}