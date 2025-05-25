"""
Database Models for PR-Connect
Matches the PostgreSQL schema on Render
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

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
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Made nullable for existing data
    
    # Additional fields for our application
    company_name = db.Column(db.String(100))
    category = db.Column(db.String(50))
    contact_info = db.Column(db.String(200))
    additional_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to responses
    responses = db.relationship('Response', backref='request', lazy=True, cascade='all, delete-orphan')
    # Relationship to user
    user = db.relationship('User', backref='requests', lazy=True)
    
    def __repr__(self):
        return f'<Request {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'body': self.body,
            'news_outlet_id': self.news_outlet_id,
            'user_id': self.user_id,
            'company_name': self.company_name,
            'category': self.category,
            'contact_info': self.contact_info,
            'additional_notes': self.additional_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'news_outlet': self.news_outlet.to_dict() if self.news_outlet else None,
            'user': self.user.to_dict() if self.user else None
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

class Transcript(db.Model):
    """Speech-to-text transcripts table"""
    __tablename__ = 'transcripts'
    
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Made nullable for existing data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    word_count = db.Column(db.Integer)
    preview = db.Column(db.String(200))
    
    # Relationship to user
    user = db.relationship('User', backref='transcripts', lazy=True)
    
    def __repr__(self):
        return f'<Transcript {self.id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'word_count': len(self.text.split()) if self.text else 0,
            'preview': self.text[:100] + '...' if len(self.text) > 100 else self.text,
            'user': self.user.to_dict() if self.user else None
        }

class User(db.Model):
    """Users table for authentication and profile management"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    company_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Optional fields for future features
    phone = db.Column(db.String(20))
    location = db.Column(db.String(100))
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches the hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'company_name': self.company_name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'phone': self.phone,
            'location': self.location
        }
        if include_sensitive:
            data['password_hash'] = self.password_hash
        return data
