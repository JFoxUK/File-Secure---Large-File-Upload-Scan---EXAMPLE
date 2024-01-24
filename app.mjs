import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import mime from 'mime-types'; // Import mime-types package

// Load environment variables
dotenv.config();

const userId = process.env.USER_ID;
const userSecret = process.env.USER_SECRET;
const apiKey = process.env.API_KEY;
const localFilePath = process.env.LOCAL_FILE_PATH;
const callbackURL = process.env.CALLBACK_URL;

function getFileMimeType(filePath) {
    return mime.lookup(filePath) || 'application/octet-stream';
}

async function authenticate() {
    console.log('Starting authentication...');
    const url = 'https://api.res418.com/services/oauth2/token';
    const postData = JSON.stringify({ userId, userSecret });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: postData
        });

        if (!response.ok) {
            throw new Error('Authentication failed');
        }

        console.log('Authentication successful');
        return await response.json();
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

async function getUploadURL(accessToken, filePath) {
    console.log('Requesting upload URL...');
    const url = 'https://api.res418.com/filesecure/standard/single/large-scan/get-upload-url';

    const fileName = filePath.split('/').pop();
    const contentType = getFileMimeType(filePath); // Determine file type

    const metadata = {
        fileName: fileName,
        contentType: contentType, // Updated to dynamic file content type
        callbackUrl: callbackURL,
        fileId: "file-test-1", // Update this with your actual file ID
        origin: "user-upload",
        originId: "desktop", // Update this with your actual origin ID
        companyName: "Res418 Local",
        requestingUser: "user@example.com",
        fileOwnerUser: "owner@example.com"
    };
    
    const admin = {
        email: "admin@example.com" // Your admin email
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'x-access-token': accessToken
            },
            body: JSON.stringify({ metadata, admin })
        });

        if (!response.ok) {
            throw new Error('Failed to get upload URL');
        }

        console.log('Upload URL received');
        return await response.json();
    } catch (error) {
        console.error('Error getting upload URL:', error);
        throw error;
    }
}

async function uploadFile(fileUploadURL, filePath) {
    console.log(`Uploading file to ${fileUploadURL}...`);
    const fileContent = fs.readFileSync(filePath);
    const contentType = getFileMimeType(filePath); // Determine file type

    try {
        const response = await fetch(fileUploadURL, {
            method: 'PUT',
            body: fileContent,
            headers: { 'Content-Type': contentType } // Updated to dynamic content type
        });

        if (!response.ok) {
            throw new Error('File upload failed');
        }

        console.log('File uploaded successfully');
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

async function initiateScan(accessToken, transactionId, fileURL) {
    console.log('Initiating scan...');
    const url = 'https://api.res418.com/filesecure/standard/single/large-scan/init';
    const data = { transactionId, fileURL };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'x-access-token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to initiate scan');
        }

        console.log('Scan initiated successfully');
        return await response.json();
    } catch (error) {
        console.error('Error initiating scan:', error);
        throw error;
    }
}

async function main() {
    try {
        const tokens = await authenticate();
        const accessToken = tokens.access_token;
        const uploadDetails = await getUploadURL(accessToken, localFilePath);
        const fileUploadURL = uploadDetails.fileUploadURL;

        await uploadFile(fileUploadURL, localFilePath);
        await initiateScan(accessToken, uploadDetails.transactionId, fileUploadURL);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
