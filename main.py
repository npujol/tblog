# Enhanced static site bot with image support
import os
import base64
from telegram import Bot
from github import Github
import cloudinary.uploader

class StaticBlogBot:
    def __init__(self):
        self.bot = Bot(os.getenv('BOT_TOKEN'))
        self.github = Github(os.getenv('GITHUB_TOKEN'))
        self.repo = self.github.get_repo('username/blog-repo')
    
    async def process_blog_post(self, message):
        # Parse message format:
        # Title
        # ===
        # category1,category2
        # ===
        # Content here
        
        lines = message.text.split('\n')
        title = lines[0]
        separator_indices = [i for i, line in enumerate(lines) if line == '===']
        
        categories = lines[separator_indices[0] + 1].split(',')
        content = '\n'.join(lines[separator_indices[1] + 1:])
        
        # Handle images if present
        image_url = None
        if message.photo:
            image_url = await self.upload_image(message.photo[-1])
        
        # Create markdown post
        post_content = self.create_markdown_post(
            title, categories, content, image_url
        )
        
        # Push to GitHub
        filename = f"_posts/{datetime.now().strftime('%Y-%m-%d')}-{title.lower().replace(' ', '-')}.md"
        self.repo.create_file(
            path=filename,
            message=f"Add post: {title}",
            content=post_content
        )
    
    async def upload_image(self, photo):
        file = await self.bot.get_file(photo.file_id)
        file_data = await file.download_as_bytearray()
        
        result = cloudinary.uploader.upload(
            file_data,
            transformation=[
                {'width': 800, 'crop': 'limit'},
                {'quality': 'auto:eco'}
            ]
        )
        return result['secure_url']
    
    def create_markdown_post(self, title, categories, content, image_url):
        frontmatter = f"""---
title: "{title}"
date: {datetime.now().isoformat()}
categories: {categories}
{"image: " + image_url if image_url else ""}
---

"""
        return frontmatter + content