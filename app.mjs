import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const userId = process.env.USER_ID;
const userSecret = process.env.USER_SECRET;
const apiKey = process.env.API_KEY;
const localFilePath = process.env.LOCAL_FILE_PATH;
const callbackURL = process.env.CALLBACK_URL;

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
        return response.json();
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

async function getUploadURL(accessToken) {
    console.log('Requesting upload URL...');
    const url = 'https://api.res418.com/filesecure/standard/single/large-scan/get-upload-url';
    const metadata = {
      fileName: "cv.pdf", // Update this with your actual file name
      contentType: "application/pdf",   // Update this with your actual file content type
      callbackUrl: callbackURL,
      fileId: "cv-test-1",           // Update this with your actual file ID
      origin: "user-upload",
      originId: "desktop",       // Update this with your actual origin ID
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
        return response.json();
    } catch (error) {
        console.error('Error getting upload URL:', error);
        throw error;
    }
}

async function uploadFile(fileUploadURL, filePath) {
    console.log(`Uploading file to ${fileUploadURL}...`);
    const fileContent = fs.readFileSync(filePath);

    try {
        const response = await fetch(fileUploadURL, {
            method: 'PUT',
            body: fileContent,
            headers: { 'Content-Type': 'application/pdf' }
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
        return response.json();
    } catch (error) {
        console.error('Error initiating scan:', error);
        throw error;
    }
}

async function main() {
    try {
        const tokens = await authenticate();
        const accessToken = tokens.access_token;
        const uploadDetails = await getUploadURL(accessToken);
        const fileUploadURL = uploadDetails.fileUploadURL;
        const filePath = localFilePath;

        await uploadFile(fileUploadURL, filePath);
        await initiateScan(accessToken, uploadDetails.transactionId, fileUploadURL);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
