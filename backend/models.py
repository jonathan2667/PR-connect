"""
Database Models for PR-Connect
Matches the PostgreSQL schema on Render
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class NewsOutlet(db.Model):
    """News outlets table - stores available media outlets"""
    __tablename__ = 'news_outlets'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    
    # Relationship to requests
    requests = db.relationship('Request', backref='news_outlet', lazy=True)
    
    def __repr__(self):
        return f'<NewsOutlet {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

class Request(db.Model):
    """Press release requests table"""
    __tablename__ = 'requests'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    body = db.Column(db.String(2000), nullable=False)
    news_outlet_id = db.Column(db.Integer, db.ForeignKey('news_outlets.id'), nullable=False)
    
    # Additional fields for our application
    company_name = db.Column(db.String(100))
    category = db.Column(db.String(50))
    contact_info = db.Column(db.String(200))
    additional_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to responses
    responses = db.relationship('Response', backref='request', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Request {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'body': self.body,
            'news_outlet_id': self.news_outlet_id,
            'company_name': self.company_name,
            'category': self.category,
            'contact_info': self.contact_info,
            'additional_notes': self.additional_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'news_outlet': self.news_outlet.to_dict() if self.news_outlet else None
        }

class Response(db.Model):
    """Generated press release responses table"""
    __tablename__ = 'responses'
    
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(2000), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey('requests.id'), nullable=False)
    
    # Additional fields for our application
    tone = db.Column(db.String(100))
    word_count = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Response for Request {self.request_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'body': self.body,
            'request_id': self.request_id,
            'tone': self.tone,
            'word_count': self.word_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        } 