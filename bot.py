import os
import asyncio
from telegram.ext import Application, MessageHandler, filters
from utils.github_api import GitHubManager
from utils.post_parser import MessageParser

class TelegramBlogBot:
    def __init__(self):
        self.github = GitHubManager()
        self.parser = MessageParser()
        
    async def handle_message(self, update, context):
        if '#blogpost' in update.message.text:
            await self.create_blog_post(update.message)
            
    async def create_blog_post(self, message):
        post_data = self.parser.parse_message(message)
        await self.github.create_post(post_data)

if __name__ == '__main__':
    bot = TelegramBlogBot()
    app = Application.builder().token(os.getenv('BOT_TOKEN')).build()
    app.add_handler(MessageHandler(filters.TEXT, bot.handle_message))
    app.run_polling()