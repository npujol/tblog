/**
 * Telegram Webhook Handler for Vercel Functions
 *
 * This function receives webhook calls from Telegram Bot API and processes
 * messages for approval workflow. It handles both text and image messages.
 */

const crypto = require('crypto');
const https = require('https');
const { Octokit } = require('@octokit/rest');

// Environment variables (set in Vercel dashboard)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

// Telegram API base URL
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Initialize GitHub API client
const octokit = new Octokit({
    auth: GITHUB_TOKEN,
});

/**
 * Main webhook handler function
 */
module.exports = async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify webhook signature
        if (!verifyTelegramSignature(req)) {
            console.error('Invalid Telegram signature');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Process the webhook update
        const update = req.body;
        console.log('Received Telegram update:', JSON.stringify(update, null, 2));

        // Handle message updates
        if (update.message) {
            await processMessage(update.message);
        }

        // Respond to Telegram
        res.status(200).json({ ok: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Verify Telegram webhook signature
 */
function verifyTelegramSignature(req) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('TELEGRAM_BOT_TOKEN not configured');
        return false;
    }

    const secret = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
    const signature = req.headers['x-telegram-bot-api-secret-token'];

    if (!signature) {
        // If no signature header, skip verification for development
        console.warn('No Telegram signature header found');
        return true; // Allow for initial setup
    }

    const hash = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    const expectedSignature = `sha256=${hash}`;

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * Process incoming Telegram message
 */
async function processMessage(message) {
    console.log('Processing message:', message.message_id);

    // Skip messages from bots or without content
    if (message.from?.is_bot || (!message.text && !message.photo && !message.caption)) {
        console.log('Skipping bot message or message without content');
        return;
    }

    try {
        // Create message data structure
        const messageData = await createMessageData(message);

        // Download and store images if present
        if (message.photo && message.photo.length > 0) {
            messageData.images = await processImages(message, messageData.id);
        }

        // Store message in pending queue
        await addToPendingMessages(messageData);

        console.log(`Successfully processed message ${messageData.id}`);

        // Optional: Send confirmation back to Telegram
        // await sendTelegramMessage(message.chat.id, '✅ Message received and queued for approval');

    } catch (error) {
        console.error('Error processing message:', error);

        // Optional: Send error message back to Telegram
        // await sendTelegramMessage(message.chat.id, '❌ Failed to process message');
    }
}

/**
 * Create standardized message data structure
 */
async function createMessageData(message) {
    const timestamp = new Date(message.date * 1000).toISOString();
    const messageId = `msg_${message.date}_${message.message_id}`;

    return {
        id: messageId,
        telegram_message_id: message.message_id,
        content: message.text || message.caption || '',
        images: [],
        timestamp: timestamp,
        status: 'pending',
        tags: [],
        created_at: new Date().toISOString(),
        chat_id: message.chat.id,
        from_user: {
            id: message.from.id,
            username: message.from.username,
            first_name: message.from.first_name,
            last_name: message.from.last_name
        }
    };
}

/**
 * Process and download images from Telegram message
 */
async function processImages(message, messageId) {
    const images = [];

    try {
        // Get the largest photo size
        const photo = message.photo[message.photo.length - 1];
        const fileInfo = await getTelegramFile(photo.file_id);

        if (fileInfo && fileInfo.file_path) {
            const imageData = await downloadTelegramFile(fileInfo.file_path);
            const filename = `${messageId}_${photo.file_id}.jpg`;
            const imagePath = `/static/images/${messageId}/${filename}`;

            // Upload image to GitHub repository
            await uploadImageToGitHub(imagePath, imageData);

            images.push({
                filename: filename,
                path: imagePath,
                caption: message.caption || '',
                file_id: photo.file_id,
                file_size: photo.file_size
            });

            console.log(`Downloaded and stored image: ${filename}`);
        }

    } catch (error) {
        console.error('Error processing images:', error);
        // Continue without images rather than failing the entire message
    }

    return images;
}

/**
 * Get file information from Telegram
 */
async function getTelegramFile(fileId) {
    return new Promise((resolve, reject) => {
        const url = `${TELEGRAM_API_BASE}/getFile?file_id=${fileId}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.ok) {
                        resolve(response.result);
                    } else {
                        reject(new Error(`Telegram API error: ${response.description}`));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

/**
 * Download file from Telegram servers
 */
async function downloadTelegramFile(filePath) {
    return new Promise((resolve, reject) => {
        const url = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

        https.get(url, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
        }).on('error', reject);
    });
}

/**
 * Upload image to GitHub repository
 */
async function uploadImageToGitHub(imagePath, imageData) {
    try {
        // Convert buffer to base64
        const content = imageData.toString('base64');

        // Clean path for GitHub API (remove leading slash and 'static/')
        const githubPath = imagePath.replace(/^\/static\//, '');

        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: `static/images/${githubPath}`,
            message: `Add image from Telegram message`,
            content: content,
            committer: {
                name: 'Telegram Bot',
                email: 'bot@telegram.org'
            }
        });

        console.log(`Uploaded image to GitHub: ${githubPath}`);

    } catch (error) {
        // If file already exists, that's okay
        if (error.status !== 422) {
            throw error;
        }
        console.log(`Image already exists: ${imagePath}`);
    }
}

/**
 * Add message to pending queue
 */
async function addToPendingMessages(messageData) {
    try {
        // Get current pending messages file
        let pendingData;
        try {
            const response = await octokit.rest.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: 'data/pending-messages.json'
            });

            const content = Buffer.from(response.data.content, 'base64').toString();
            pendingData = JSON.parse(content);
        } catch (error) {
            if (error.status === 404) {
                // File doesn't exist, create default structure
                pendingData = {
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                    version: "1.0"
                };
            } else {
                throw error;
            }
        }

        // Add new message
        pendingData.messages.push(messageData);
        pendingData.lastUpdated = new Date().toISOString();

        // Update file in repository
        const updatedContent = Buffer.from(JSON.stringify(pendingData, null, 2)).toString('base64');

        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: 'data/pending-messages.json',
            message: `Add pending message ${messageData.id}`,
            content: updatedContent,
            sha: pendingData.sha, // Use SHA if file exists
            committer: {
                name: 'Telegram Bot',
                email: 'bot@telegram.org'
            }
        });

        console.log(`Added message to pending queue: ${messageData.id}`);

    } catch (error) {
        console.error('Error adding to pending messages:', error);
        throw error;
    }
}

/**
 * Send message back to Telegram (optional)
 */
async function sendTelegramMessage(chatId, text) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            chat_id: chatId,
            text: text
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}