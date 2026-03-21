import traceback
from flask import Blueprint, jsonify, request, session
from app.utils.decorators import login_required
from app.models.prediction import Prediction, save_prediction, get_predictions_by_user, get_all_predictions
from app.models.user import User
from app.services.predictor import run_prediction
from app.extensions import db

api_bp = Blueprint('api', __name__)

@api_bp.route('/predict', methods=['POST'])
@login_required
def predict():
    """Run Random Forest prediction with live weather and return full results."""
    data = request.json or {}

    week_kwh  = float(data.get('week_kwh', 0))
    month_kwh = float(data.get('month_kwh', 0))
    year_kwh  = float(data.get('year_kwh', 0))
    city      = data.get('city', 'karachi')
    company   = data.get('company_name', 'Unknown')
    category  = data.get('category', 'general')

    if week_kwh <= 0 or month_kwh <= 0 or year_kwh <= 0:
        return jsonify({"success": False, "error": "All kWh values must be greater than 0"}), 400

    try:
        result = run_prediction(week_kwh, month_kwh, year_kwh, city, category)
        result['company_name'] = company
        # Save to DB - include full result for restoration
        save_prediction(
            user_id=session['user_id'],
            company_name=company,
            city=city,
            category=category,
            week_val=result['predictions']['next_week'],
            month_val=result['predictions']['next_month'],
            year_val=result['predictions']['next_year'],
            insights=result # Save the whole dictionary
        )
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/weather', methods=['GET'])
@login_required
def get_weather():
    """Fetch live weather data for a city without running a prediction."""
    city = request.args.get('city', 'karachi')
    try:
        from app.services.predictor import fetch_weather
        weather_data = fetch_weather(city)
        return jsonify({"success": True, "weather": weather_data})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/me')
@login_required
def get_me():
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    return jsonify({"success": True, "user": user.to_dict()})

@api_bp.route('/predictions', methods=['GET', 'POST'])
@login_required
def handle_predictions():
    if request.method == 'POST':
        data = request.json
        user_id = session['user_id']
        
        # User details might be helpful for category if not passed
        user = get_user_by_id(user_id)
        category = data.get('category', getattr(user, 'category', 'General'))
        
        success = save_prediction(
            user_id=user_id,
            company_name=data.get('companyName'),
            city=data.get('city'),
            category=category,
            week_val=data.get('values', {}).get('week'),
            month_val=data.get('values', {}).get('month'),
            year_val=data.get('values', {}).get('year'),
            insights=data.get('insights', [])
        )
        return jsonify({"success": success})
        
    else: # GET
        preds = get_predictions_by_user(session['user_id'])
        return jsonify({"success": True, "predictions": [p.to_dict() for p in preds]})

@api_bp.route('/users/count')
def get_users_count():
    try:
        count = User.query.count()
        return jsonify({"success": True, "count": count})
    except Exception as e:
        return jsonify({"success": False, "count": 0, "error": str(e)})

@api_bp.route('/predictions/count')
def get_predictions_count():
    try:
        count = Prediction.query.count()
        return jsonify({"success": True, "count": count})
    except Exception as e:
        return jsonify({"success": False, "count": 0, "error": str(e)})

# Add Admin endpoints
@api_bp.route('/admin/users')
@login_required
def admin_users():
    # Only allow admin
    user = User.query.get(session['user_id'])
    if not user or not user.is_admin:
        return jsonify({"success": False, "error": "Unauthorized"}), 403
        
    users = User.query.all()
    return jsonify({"success": True, "users": [u.to_dict() for u in users]})

@api_bp.route('/admin/predictions')
@login_required
def admin_predictions():
    # Only allow admin
    preds = get_all_predictions()
    return jsonify({"success": True, "predictions": preds})

@api_bp.route('/admin/users/<int:user_id>/make_admin', methods=['POST'])
@login_required
def admin_make_user_admin(user_id):
    current_user = User.query.get(session['user_id'])
    if not current_user or not current_user.is_admin:
        return jsonify({"success": False, "error": "Unauthorized"}), 403
        
    target_user = User.query.get(user_id)
    if target_user:
        target_user.is_admin = True
        db.session.commit()
    return jsonify({"success": True})

@api_bp.route('/admin/users/<int:user_id>/remove_admin', methods=['POST'])
@login_required
def admin_remove_user_admin(user_id):
    current_user = User.query.get(session['user_id'])
    if not current_user or not current_user.is_admin:
        return jsonify({"success": False, "error": "Unauthorized"}), 403
        
    target_user = User.query.get(user_id)
    if target_user:
        target_user.is_admin = False
        db.session.commit()
    return jsonify({"success": True})

@api_bp.route('/admin/predictions/all', methods=['DELETE'])
@login_required
def admin_delete_all_predictions():
    current_user = User.query.get(session['user_id'])
    if not current_user or not current_user.is_admin:
        return jsonify({"success": False, "error": "Unauthorized"}), 403
        
    Prediction.query.delete()
    db.session.commit()
    return jsonify({"success": True})

@api_bp.route('/admin/update_profile', methods=['PUT'])
@login_required
def admin_update_profile():
    current_user = User.query.get(session['user_id'])
    if not current_user or not current_user.is_admin:
        return jsonify({"success": False, "error": "Unauthorized"}), 403
        
    data = request.json
    fullname = data.get('fullname')
    organization = data.get('organization')
    
    if not fullname or not organization:
        return jsonify({"success": False, "error": "Missing fields"}), 400
        
    current_user.fullname = fullname
    current_user.organization = organization
    db.session.commit()
    
    session['fullname'] = fullname
    return jsonify({"success": True})

@api_bp.route('/admin/predictions/<int:prediction_id>', methods=['DELETE'])
@login_required
def admin_delete_prediction(prediction_id):
    current_user = User.query.get(session['user_id'])
    if not current_user or not current_user.is_admin:
        return jsonify({"success": False, "error": "Unauthorized"}), 403
        
    target_pred = Prediction.query.get(prediction_id)
    if target_pred:
        db.session.delete(target_pred)
        db.session.commit()
    return jsonify({"success": True})

@api_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@login_required
def admin_delete_user(user_id):
    current_user = User.query.get(session['user_id'])
    if not current_user or not current_user.is_admin:
        return jsonify({"success": False, "error": "Unauthorized"}), 403
        
    target_user = User.query.get(user_id)
    if target_user:
        db.session.delete(target_user)
        db.session.commit()
    return jsonify({"success": True})
