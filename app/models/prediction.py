from app.extensions import db
from datetime import datetime
import json

class Prediction(db.Model):
    __tablename__ = 'predictions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_name = db.Column(db.String(150))
    city = db.Column(db.String(100))
    category = db.Column(db.String(100))
    week_val = db.Column(db.Float)
    month_val = db.Column(db.Float)
    year_val = db.Column(db.Float)
    insights = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        # Calculate a pseudo-growth percentage based on week vs month average
        growth = 0.0
        if self.month_val and self.month_val > 0 and self.week_val:
            weekly_avg_from_month = self.month_val / 4.33
            growth = round(((self.week_val - weekly_avg_from_month) / weekly_avg_from_month) * 100, 1) if weekly_avg_from_month > 0 else 0.0

        return {
            'id': self.id,
            'user_id': self.user_id,
            'company_name': self.company_name,
            'city': self.city,
            'category': self.category,
            'week_val': self.week_val,
            'month_val': self.month_val,
            'year_val': self.year_val,
            'growth_pct': growth,
            'insights': self.insights,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Legacy helper functions
def save_prediction(user_id, company_name, city, category, week_val, month_val, year_val, insights):
    pred = Prediction(
        user_id=user_id,
        company_name=company_name,
        city=city,
        category=category,
        week_val=week_val,
        month_val=month_val,
        year_val=year_val,
        insights=insights
    )
    try:
        db.session.add(pred)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error saving prediction: {e}")
        return False

def get_predictions_by_user(user_id):
    return Prediction.query.filter_by(user_id=user_id).order_by(Prediction.created_at.desc()).all()

def get_all_predictions():
    # Using join to get user details as well
    results = db.session.query(Prediction, User.fullname, User.email)\
        .join(User, Prediction.user_id == User.id)\
        .order_by(Prediction.created_at.desc()).all()
    
    final = []
    for pred, fullname, email in results:
        d = pred.to_dict()
        d['user_fullname'] = fullname
        d['user_email'] = email
        final.append(d)
    return final

def create_prediction_table():
    pass

from .user import User # Circular import protection at bottom
