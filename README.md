# tblog: Telegram Bot to Hugo Blog

A complete system for automatically converting Telegram bot messages into blog posts using Hugo static site generator, with manual approval workflow and GitHub Pages hosting.

## 🌟 Features

- **Real-time Message Processing**: Webhook-based Telegram message reception
- **Manual Approval Workflow**: Web interface for reviewing and approving messages
- **Image Support**: Automatic download and integration of images from messages
- **Tag Management**: Add custom tags to organize blog posts
- **Automated Deployment**: GitHub Actions automatically builds and deploys the Hugo site
- **Archive System**: Automatic archiving of old messages to keep data manageable

## 🏗️ Architecture

- **Hugo Static Site**: Fast, SEO-friendly blog generation
- **Vercel Functions**: Serverless webhook processing
- **GitHub Pages**: Free static site hosting with CDN
- **GitHub Actions**: Automated CI/CD pipeline
- **GitHub Repository**: Central data storage and version control

## 📋 Prerequisites

1. **Telegram Bot**: Create a bot via [@BotFather](https://t.me/botfather)
2. **GitHub Repository**: Public repository for GitHub Pages hosting
3. **Vercel Account**: For serverless webhook functions
4. **GitHub Personal Access Token**: For approval interface

## 🚀 Setup Instructions

### Step 1: Repository Setup

1. **Fork or clone this repository** to your GitHub account
2. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (will be created automatically)
3. **Update configuration**:
   - Edit `config.yaml` with your repository URL and details
   - Update `README.md` with your project information

### Step 2: Telegram Bot Configuration

1. **Create a new bot** with [@BotFather](https://t.me/botfather):
   ```
   /newbot
   ```
2. **Save the bot token** (you'll need it for Vercel)
3. **Configure webhook** (after Vercel deployment):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-vercel-app.vercel.app/api/webhook
   ```

### Step 3: Vercel Deployment

1. **Connect your GitHub repository** to Vercel
2. **Deploy the project** (automatic when connected)
3. **Set environment variables** in Vercel dashboard:
   - `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
   - `GITHUB_TOKEN`: Personal access token with repo permissions
   - `GITHUB_OWNER`: Your GitHub username
   - `GITHUB_REPO`: Repository name

### Step 4: GitHub Actions Setup

1. **Create GitHub Secrets** (Settings → Secrets and variables → Actions):
   - No additional secrets needed (uses built-in `GITHUB_TOKEN`)
2. **Verify workflow runs** after pushing changes

### Step 5: Approval Interface Setup

1. **Create GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate token with `repo` scope
2. **Access approval interface**:
   - Visit: `https://your-username.github.io/your-repo-name/admin/`
   - Enter your GitHub token to connect

## 🔧 Usage

### For Content Creators

1. **Send messages** to your Telegram bot (text and/or images)
2. **Review pending messages** in the admin interface
3. **Add tags** and approve messages for publication
4. **Monitor published posts** in the blog

### For Readers

- Visit your GitHub Pages URL to read the blog
- Posts are organized chronologically with tag filtering
- RSS feed available at `/index.xml`

## 📁 Project Structure

```
├── api/                    # Vercel Functions
│   ├── webhook.js         # Telegram webhook handler
│   └── package.json       # API dependencies
├── content/               # Hugo content
│   ├── posts/            # Generated blog posts
│   └── _index.md         # Homepage content
├── data/                  # Message storage
│   ├── pending-messages.json
│   ├── approved-messages.json
│   ├── published-messages.json
│   └── schema.json       # Data structure schema
├── scripts/               # Content processing
│   ├── generate-content.js  # Message → Hugo post conversion
│   └── archive-messages.js  # Archive management
├── static/                # Static assets
│   ├── admin/            # Approval interface
│   └── images/           # Message images
├── .github/workflows/     # GitHub Actions
│   └── hugo.yml          # Hugo build and deploy
├── config.yaml           # Hugo configuration
└── package.json          # Node.js dependencies
```

## 🔒 Security

- **Telegram Webhook Security**: HMAC signature verification
- **GitHub Token**: Limited scope, client-side storage
- **Environment Variables**: Secure secret management in Vercel
- **Input Validation**: Message content sanitization

## 🛠️ Development

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Hugo**:
   ```bash
   # macOS
   brew install hugo

   # Or download from https://gohugo.io/installation/
   ```

3. **Run Hugo development server**:
   ```bash
   hugo server -D
   ```

4. **Test webhook locally** (optional):
   ```bash
   vercel dev
   ```

### Testing the Approval Interface

1. **Add test data** to `data/pending-messages.json`
2. **Open admin interface** at `http://localhost:1313/admin/`
3. **Connect with GitHub token** and test approval workflow

## 📊 Monitoring

- **Vercel Analytics**: Function performance and errors
- **GitHub Actions**: Build and deployment logs
- **GitHub Pages**: Site analytics and performance
- **Browser Console**: Client-side debugging for approval interface

## 🔧 Customization

### Hugo Theme

- Default theme: Ananke (fast and simple)
- **Change theme**: Update `config.yaml` and install in `themes/` directory
- **Custom layouts**: Add overrides in `layouts/` directory

### Message Processing

- **Modify data structure**: Update `data/schema.json` and processing scripts
- **Custom post format**: Edit `scripts/generate-content.js`
- **Additional filters**: Enhance webhook processing in `api/webhook.js`

### Approval Interface

- **UI customization**: Modify `static/admin/style.css`
- **Feature additions**: Extend `static/admin/script.js`
- **Workflow changes**: Update approval logic and GitHub API calls

## 📚 API Reference

### Webhook Endpoint

**POST** `/api/webhook`

Receives Telegram webhook updates and processes messages.

### Data Files

- `pending-messages.json`: Messages awaiting approval
- `approved-messages.json`: Messages ready for publication
- `published-messages.json`: Successfully published posts
- `rejected-messages.json`: Rejected messages (for audit)

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | Yes |
| `GITHUB_TOKEN` | Personal access token | Yes |
| `GITHUB_OWNER` | Repository owner username | Yes |
| `GITHUB_REPO` | Repository name | Yes |

## 🐛 Troubleshooting

### Common Issues

1. **Webhook not receiving messages**:
   - Verify bot token and Vercel URL
   - Check Vercel function logs
   - Confirm webhook is set in Telegram

2. **GitHub Actions failing**:
   - Check Hugo version compatibility
   - Verify repository permissions
   - Review action logs for specific errors

3. **Approval interface not loading**:
   - Verify GitHub Pages is enabled
   - Check browser console for errors
   - Confirm GitHub token permissions

4. **Images not displaying**:
   - Verify image paths in generated posts
   - Check GitHub repository for uploaded files
   - Ensure Hugo static file processing

### Debug Commands

```bash
# Test content generation locally
npm run generate

# Check Hugo build
npm run build

# Verify data files
cat data/pending-messages.json | jq .

# Test webhook locally
curl -X POST http://localhost:3000/api/webhook -H "Content-Type: application/json" -d '{"test": true}'
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR-USERNAME/YOUR-REPO/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR-USERNAME/YOUR-REPO/discussions)
- **Documentation**: This README and inline code comments

---

**Built with ❤️ using Hugo, Vercel, and GitHub**