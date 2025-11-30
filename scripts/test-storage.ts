import { supabase, SUPABASE_BUCKET, checkBucketAccess, listFiles } from '@/lib/supabase'

async function testStorage() {
    console.log('🧪 Testing Supabase Storage...')

    try {
        // Test bucket access
        console.log('1. Testing bucket access...')
        const isAccessible = await checkBucketAccess(SUPABASE_BUCKET)
        if (!isAccessible) {
            console.log('❌ Bucket not accessible')
            return
        }
        console.log('✅ Bucket is accessible')

        // Test listing files
        console.log('2. Testing file listing...')
        const files = await listFiles(SUPABASE_BUCKET, '')
        console.log(`✅ Found ${files?.length || 0} files in bucket`)

        // Test bucket configuration
        console.log('3. Testing bucket configuration...')
        const { data: buckets } = await supabase.storage.listBuckets()
        const ourBucket = buckets?.find(b => b.name === SUPABASE_BUCKET)

        if (ourBucket) {
            console.log('✅ Bucket configuration loaded:')
            console.log('   - Public:', ourBucket.public)
            console.log('   - File size limit:', ourBucket.file_size_limit)
        }

        console.log('\n🎉 All storage tests passed!')

    } catch (error) {
        console.error('❌ Storage test failed:', error)
    }
}

testStorage().catch(console.error)