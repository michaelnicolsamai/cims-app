// scripts/setup-storage.ts
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '..', '.env') })

async function setupStorage() {
    // Dynamically import after env is loaded
    const { supabase, SUPABASE_BUCKET, checkBucketAccess } = await import('@/lib/supabase')

    console.log('🔄 Setting up Supabase storage configuration...')
    console.log(`📦 Target bucket: ${SUPABASE_BUCKET}`)
    console.log(`🔗 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`)
    console.log(`🔑 Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing required environment variables:')
        console.error('   - NEXT_PUBLIC_SUPABASE_URL')
        console.error('   - SUPABASE_SERVICE_ROLE_KEY')
        console.error('\nPlease check your .env file and make sure these variables are set.')
        return
    }

    try {
        // Check if bucket exists and is accessible
        const isAccessible = await checkBucketAccess(SUPABASE_BUCKET)

        if (!isAccessible) {
            console.log(`❌ Bucket "${SUPABASE_BUCKET}" is not accessible`)
            console.log('Please check:')
            console.log('1. Bucket exists in Supabase Storage')
            console.log('2. Service role key has proper permissions')
            console.log('3. Bucket name is correct')
            return
        }

        console.log(`✅ Bucket "${SUPABASE_BUCKET}" is accessible`)

        // Configure the bucket
        const { error: updateError } = await supabase.storage.updateBucket(SUPABASE_BUCKET, {
            public: false, // Private bucket
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: [
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/gif',
                'application/pdf',
                'text/csv',
                'application/json',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
        })

        if (updateError) {
            console.error('❌ Error configuring bucket:', updateError)
            return
        }

        console.log('✅ Successfully configured bucket settings')

        // Verify configuration
        const { data: buckets } = await supabase.storage.listBuckets()
        const ourBucket = buckets?.find(b => b.name === SUPABASE_BUCKET)

        if (ourBucket) {
            console.log('\n📊 Bucket Configuration:')
            console.log('   - Name:', ourBucket.name)
            console.log('   - Public:', ourBucket.public)
            console.log('   - File size limit:', formatBytes(ourBucket.file_size_limit || 0))
            console.log('   - Allowed MIME types:', ourBucket.allowed_mime_types?.join(', ') || 'All types')
            console.log('   - Created:', new Date(ourBucket.created_at).toLocaleString())
        }

        console.log('\n🎉 Storage setup completed successfully!')
        console.log('\n📁 Folder structure will be:')
        console.log('   - product-image/[ownerId]/products/[productId]/')
        console.log('   - customer-document/[ownerId]/customers/[customerId]/')
        console.log('   - invoice/[ownerId]/invoices/[saleId]/')
        console.log('   - report-export/[ownerId]/exports/')
        console.log('   - business-logo/[ownerId]/logos/')

    } catch (error) {
        console.error('❌ Storage setup failed:', error)
    }
}

function formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

setupStorage().catch(console.error)