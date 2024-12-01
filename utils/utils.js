const path = require('path');
const fs = require('fs').promises;
const postsDir = path.join(__dirname, '..', 'posts');
const sharp = require('sharp');
var debug = require('debug');


const Minio = require('minio');
var buckets = ['bollox'];

const minioClient = new Minio.Client({
    endPoint: 'objects.hbvu.su',
    port: 443,
    useSSL: true,
    accessKey:  process.env.MINIO_ACCESS_KEY,
    secretKey:  process.env.MINIO_SECRET_KEY
});

const uploadToMinio = async (file, bucketName, folderPath, fileName) => {
    try {
        // Resize the image to 1920x1920 pixels using sharp
        const resizedImageBuffer = await sharp(file.buffer)
            .resize(1920, 1920, { fit: 'inside' })
            .toBuffer();

        // Construct the full object name using the folder path and file name
        const objectName = `${folderPath}/${fileName}`;

        debug(`Uploading to bucket: ${bucketName}, object: ${objectName}`); // Log for debugging

        // Upload the resized image buffer to MinIO
        await minioClient.putObject(bucketName, objectName, resizedImageBuffer);
        return(`File uploaded successfully to ${bucketName}/${objectName}.`);
    } catch (err) {
        return(err);
    }
}

const fetchBuckets = async () => {
    return buckets
};

const getUploadParams = async () => {
    const today = new Date();

    // Create bucket in YYYY/MM format
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const filePath = `${year}/${month}`;

    // Create file name in DD.jpeg format
    const day = String(today.getDate()).padStart(2, '0');
    const fileName = `${day}.jpeg`;
    return { fileName, filePath }
}

const findLatestPost = async () => {

    let latestPostDate = null;
    let latestPostPath = null;

    try {
        const years = await fs.readdir(postsDir);
        for (const year of years) {
            // Only proceed if it's a directory
            const yearPath = path.join(postsDir, year);
            if (!(await fs.stat(yearPath)).isDirectory()) {
                continue;
            }

            const monthsDir = path.join(postsDir, year);
            const months = await fs.readdir(monthsDir);

            for (const month of months) {
                // Only proceed if it's a directory
                const monthPath = path.join(monthsDir, month);
                if (!(await fs.stat(monthPath)).isDirectory()) {
                    continue;
                }

                const daysDir = path.join(monthsDir, month);
                const days = await fs.readdir(daysDir);

                for (const day of days) {
                    const dayRegex = /^(0[1-9]|[12][0-9]|3[01])\.md$/;

                    if (!dayRegex.test(day)) {
                        continue;
                    }
                    // Only process markdown files
                    if (!day.endsWith('.md')) {
                        continue;
                    }

                    const postPath = path.join(year, month, day);
                    const dateParts = postPath.split('/');
                    const postDate = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2].replace('.md', '')}`);

                    if (!latestPostDate || postDate > latestPostDate) {
                        latestPostDate = postDate;
                        latestPostPath = postPath;
                    }
                }
            }
        }

        return { latestPostPath, latestPostDate };
    } catch (error) {
        console.error('Error reading post files:', error);
        throw new Error('Could not retrieve post files');
    }
}

async function getNext(dateString) {

    const year = parseInt(dateString.slice(0, 4));
    const month = parseInt(dateString.slice(4, 6)) - 1; // JS months are 0-indexed
    const day = parseInt(dateString.slice(6));
    let date = new Date(year, month, day);

    let iterations = 0;
    while (iterations < 365) {
        iterations++;
        date.setDate(date.getDate() + 1);
        const nextYear = date.getFullYear().toString();
        const nextMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const nextDay = date.getDate().toString().padStart(2, '0');
        const filePath = path.join(postsDir, nextYear, nextMonth, `${nextDay}.md`);

        try {
            await fs.access(filePath);
            return `${nextYear}${nextMonth}${nextDay}`;
        } catch (error) {
            // Log the missing entry
            // console.log(`No entry found for ${nextYear}-${nextMonth}-${nextDay}. Checking next date...`);
            // Continue to next date
        }
    }
}

async function getPrev(dateString) {
    const year = parseInt(dateString.slice(0, 4));
    const month = parseInt(dateString.slice(4, 6)) - 1; // JS months are 0-indexed
    const day = parseInt(dateString.slice(6));
    let date = new Date(year, month, day);

    let iterations = 0;
    while (iterations < 365) {
        iterations++; date.setDate(date.getDate() - 1);
        const prevYear = date.getFullYear().toString();
        const prevMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const prevDay = date.getDate().toString().padStart(2, '0');
        const filePath = path.join(postsDir, prevYear, prevMonth, `${prevDay}.md`);

        try {
            await fs.access(filePath);
            return `${prevYear}${prevMonth}${prevDay}`;
        } catch (error) {
            // Log the missing entry
            // console.err(`No entry found for ${prevYear}-${prevMonth}-${prevDay}. Checking previous date...`);
            // Continue to previous date
        }
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);

    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');

    let formatted = `${year}${month}${day}`;
    return formatted;
}

async function main() {
    try {
        bucketsList = await minioClient.listBuckets();
        buckets = bucketsList.map(bucket => bucket.name);
    } catch (err) {
        console.error('Error fetching buckets:', err);
    }
}

// Invoke the main function
main().catch(error => {
    console.error("Unhandled error in main:", error);
    process.exit(1);
})

module.exports = {
    findLatestPost,
    getNext,
    getPrev,
    formatDate,
    fetchBuckets,
    getUploadParams,
    uploadToMinio
};