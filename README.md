# tblog: Telegram Bot to Hugo Blog

A complete system for automatically converting Telegram bot messages into blog posts using Hugo static site generator, with manual approval workflow and GitHub Pages hosting.

## 🌟 Features

- **Daily Message Processing**: Automated polling of Telegram messages once per day
- **Manual Approval Workflow**: Web interface for reviewing and approving messages
- **Image Support**: Automatic download and integration of images from messages
- **Tag Management**: Add custom tags to organize blog posts
- **Automated Deployment**: GitHub Actions automatically builds and deploys the Hugo site
- **Archive System**: Automatic archiving of old messages to keep data manageable

## 🏗️ Architecture

- **Hugo Static Site**: Fast, SEO-friendly blog generation
- **Python Script**: Daily polling of Telegram Bot API updates
- **GitHub Pages**: Free static site hosting with CDN
- **GitHub Actions**: Automated CI/CD pipeline and message fetching
- **GitHub Repository**: Central data storage and version control

## 📋 Prerequisites

1. **Telegram Bot**: Create a bot via [@BotFather](https://t.me/botfather)
2. **GitHub Repository**: Public repository for GitHub Pages hosting
3. **GitHub Personal Access Token**: For approval interface

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
2. **Save the bot token** (you'll need it for GitHub Secrets)

### Step 3: GitHub Secrets Setup

1. **Create GitHub Secrets** (Settings → Secrets and variables → Actions):
   - `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
   - Note: `GITHUB_TOKEN` is automatically provided by GitHub Actions

### Step 4: GitHub Actions Setup

1. **Verify workflows are enabled** (Actions tab in GitHub repository)
2. **Test the fetch workflow** by triggering it manually (Actions → Fetch Telegram Updates → Run workflow)
3. **Verify scheduled run** will occur daily at midnight UTC

### Step 5: Approval Interface Setup

1. **Create GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate token with `repo` scope
2. **Access approval interface**:
   - Visit: `https://npujol.github.io/tblog/admin/`
   - Enter your GitHub token to connect

## 🔧 Usage

### For Content Creators

1. **Send messages** to your Telegram bot (text and/or images)
2. **Wait for daily sync** (automatic at midnight UTC) or trigger manually via GitHub Actions
3. **Review pending messages** in the admin interface
4. **Add tags** and approve messages for publication
5. **Monitor published posts** in the blog

### For Readers

- Visit your GitHub Pages URL to read the blog
- Posts are organized chronologically with tag filtering
- RSS feed available at `/index.xml`

## 📁 Project Structure

```
├── content/               # Hugo content
│   ├── posts/            # Generated blog posts
│   └── _index.md         # Homepage content
├── data/                  # Message storage
│   ├── pending-messages.json
│   ├── approved-messages.json
│   ├── published-messages.json
│   ├── last-update-id.json  # Track last processed update
│   └── schema.json       # Data structure schema
├── scripts/               # Content processing
│   ├── fetch_telegram_updates.py  # Fetch messages from Telegram
│   ├── generate-content.js        # Message → Hugo post conversion
│   └── archive-messages.js        # Archive management
├── static/                # Static assets
│   ├── admin/            # Approval interface
│   └── images/           # Message images
├── .github/workflows/     # GitHub Actions
│   ├── fetch-telegram-updates.yml # Daily message fetching
│   └── hugo.yml                   # Hugo build and deploy
├── config.yaml           # Hugo configuration
└── package.json          # Node.js dependencies
```

## 🔒 Security

- **Telegram Bot Token**: Stored securely in GitHub Secrets
- **GitHub Token**: Automatically provided by GitHub Actions with limited scope
- **API Access**: Read-only access to Telegram updates
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

4. **Test Telegram fetcher locally** (optional):
   ```bash
   export TELEGRAM_BOT_TOKEN="your_token"
   export GITHUB_TOKEN="your_token"
   export GITHUB_OWNER="your_username"
   export GITHUB_REPO="your_repo"
   python scripts/fetch_telegram_updates.py
   ```

### Testing the Approval Interface

1. **Add test data** to `data/pending-messages.json`
2. **Open admin interface** at `http://localhost:1313/admin/`
3. **Connect with GitHub token** and test approval workflow

## 📊 Monitoring

- **GitHub Actions**: Workflow logs for message fetching, build and deployment
- **GitHub Pages**: Site analytics and performance
- **Browser Console**: Client-side debugging for approval interface
- **Data Files**: Check `data/last-update-id.json` for sync status

## 🔧 Customization

### Hugo Theme

- Default theme: Ananke (fast and simple)
- **Change theme**: Update `config.yaml` and install in `themes/` directory
- **Custom layouts**: Add overrides in `layouts/` directory

### Message Processing

- **Modify data structure**: Update `data/schema.json` and processing scripts
- **Custom post format**: Edit `scripts/generate-content.js`
- **Change fetch schedule**: Modify cron expression in `.github/workflows/fetch-telegram-updates.yml`
- **Additional filters**: Enhance message processing in `scripts/fetch_telegram_updates.py`

### Approval Interface

- **UI customization**: Modify `static/admin/style.css`
- **Feature additions**: Extend `static/admin/script.js`
- **Workflow changes**: Update approval logic and GitHub API calls

## 📚 API Reference

### Telegram Bot API

The system uses the Telegram Bot API `getUpdates` method to poll for new messages daily.

### Data Files

- `pending-messages.json`: Messages awaiting approval
- `approved-messages.json`: Messages ready for publication
- `published-messages.json`: Successfully published posts
- `rejected-messages.json`: Rejected messages (for audit)
- `last-update-id.json`: Last processed Telegram update ID

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | Yes |
| `GITHUB_TOKEN` | Personal access token | Yes |
| `GITHUB_OWNER` | Repository owner username | Yes |
| `GITHUB_REPO` | Repository name | Yes |

## 🐛 Troubleshooting

### Common Issues

1. **Messages not being fetched**:
   - Verify `TELEGRAM_BOT_TOKEN` is set in GitHub Secrets
   - Check GitHub Actions workflow logs for errors
   - Ensure the workflow is enabled and scheduled correctly
   - Test manual trigger via Actions tab

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

# Check last update ID
cat data/last-update-id.json | jq .

# Test Telegram fetcher locally
python scripts/fetch_telegram_updates.py
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

- **Issues**: [GitHub Issues](https://github.com/npujol/tblog/issues)
- **Discussions**: [GitHub Discussions](https://github.com/npujol/tblog/discussions)
- **Documentation**: This README and inline code comments

---

**Built with ❤️ using Hugo, Python, and GitHub**