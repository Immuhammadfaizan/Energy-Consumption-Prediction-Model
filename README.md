# FLUX - Smart Energy Consumption Analytics Platform

## 🚀 Project Overview

FLUX is a modern, AI-powered energy consumption prediction platform for Pakistan. It leverages machine learning algorithms and real-time weather data (Open-Meteo API) to provide accurate energy consumption forecasts.

## 📁 Project Structure

```
energy_frontend/
├── index.html                 # Homepage with features overview
├── login.html                 # User login page
├── signup.html                # User registration page
├── prediction.html            # Energy prediction interface
├── statistics.html            # Statistics and analytics dashboard
├── about.html                 # About page with company info
├── admin.html                 # Admin panel (admin only)
│
├── css/
│   ├── style.css             # Main theme and global styles
│   ├── credential.css        # Login/signup page styles
│   ├── prediction.css        # Prediction page styles
│   ├── statistics.css        # Statistics page styles
│   ├── about.css             # About page styles
│   └── admin.css             # Admin panel styles
│
├── js/
│   ├── main.js               # Dashboard initialization
│   ├── auth.js               # Authentication & user management
│   ├── sidebar.js            # Sidebar navigation functionality
│   ├── prediction.js         # Prediction logic & API integration
│   ├── statistics.js         # Statistics calculation & display
│   ├── about.js              # About page functionality
│   └── admin.js              # Admin panel functionality
│
└── images/
    └── logo.png              # Company logo
```

## 🎨 Design Features

- **Dark Smoky Theme**: Modern dark background (#0a0e27) with electric blue (#00d4ff) accents
- **Electric Pink Accent**: Color (#ff006e) for highlights and CTAs
- **Responsive Sidebar**: Collapsible navigation with smooth animations
- **Smooth Transitions**: Left-to-right underline hover effects on nav menus
- **Gradient Background**: Modern gradient backgrounds throughout the site
- **Glassmorphism**: Semi-transparent effects with blur on header

### Color Scheme

- Primary Dark: #0a0e27
- Secondary Dark: #050812
- Electric Blue: #00d4ff
- Electric Pink: #ff006e
- Success Green: #00d084
- Light Text: #e0e0e0
- Gray Text: #a0a0a0

## 🔐 Authentication System

### Features:

- **User Registration**: Sign up with name, email, organization, password, city, and category
- **User Login**: Email/password authentication
- **Session Management**: User data stored in localStorage
- **Role-Based Access**: Admin-only features with access control
- **Remember Me**: Optional remember functionality

### Supported Categories:

- Residential
- Commercial
- Industrial
- Agricultural

### Supported Cities (With Coordinates):

- Karachi (24.8607°N, 67.0011°E)
- Lahore (31.5497°N, 74.3436°E)
- Islamabad (33.6844°N, 73.0479°E)
- Rawalpindi (33.5731°N, 73.1815°E)
- Faisalabad (31.5497°N, 74.3436°E)
- Multan (30.1575°N, 71.4252°E)
- Hyderabad (25.3960°N, 68.3578°E)
- Peshawar (34.0151°N, 71.5249°E)
- Quetta (30.1798°N, 66.9750°E)
- Gilgit (35.9271°N, 74.3149°E)
- Sialkot (32.4914°N, 74.5347°E)
- Gujranwala (32.1814°N, 74.1857°E)
- Sargodha (32.0840°N, 72.6711°E)
- Bahawalpur (29.1938°N, 71.6858°E)
- Sukkur (27.7064°N, 68.8456°E)

## 🔮 Prediction Features

### Input Parameters:

1. **Company/Organization Name**: Your facility name
2. **City Selection**: Choose from 15+ Pakistani cities with precise coordinates
3. **Load Data**: Previous week, month, and year energy consumption

### Prediction Output:

- Next week energy forecast
- Next month energy forecast
- Next year energy forecast
- Growth percentage trend
- Weather impact analysis (Temperature & Humidity)
- Visual chart comparing historical vs. predicted data

### Weather Integration:

- **API**: Open-Meteo Free Weather API
- **Data**: Real-time temperature, humidity, and atmospheric data
- **Impact**: Weather conditions directly adjust predictions

## 📊 Statistics & Analytics

### Features:

- **Prediction History**: View all your past predictions
- **Summary Statistics**: Average weekly, monthly, and yearly usage
- **Category Breakdown**: Analysis by energy category
- **Growth Tracking**: Monitor consumption trends over time
- **Detailed Reports**: Export and analyze prediction data

## 👥 Admin Panel

### Accessible Only To:

- Authenticated admin users
- Users promoted to admin status

### Admin Features:

1. **Dashboard**: Overview of system metrics
   - Total registered users
   - Total predictions generated
   - Active sessions count
   - System status

2. **User Management**:
   - View all registered users
   - User details (name, email, organization, city, category, join date)
   - Promote users to admin
   - Delete user accounts
   - Track login history

3. **Prediction Monitoring**:
   - View all energy predictions
   - Track predictions by user and organization
   - Monitor prediction accuracy over time
   - Filter by city and date range

4. **System Settings**:
   - System information
   - Database status
   - Backup and restore functionality
   - Auto-backup timestamp

## 🌐 Navigation Features

### Sidebar Navigation:

- Fixed sidebar (desktop) / Collapsible (mobile)
- Active page highlighting
- Admin panel access (for admins only)
- Quick logout button

### Navigation Menu:

- Home
- Prediction
- Statistics
- About

### Hover Effects:

- Left-to-right underline animation on nav links
- Gradient color transitions
- Card elevation on hover
- Button glow effects

## 📱 Responsive Design

### Breakpoints:

- **Desktop**: 1200px+ (full layout)
- **Tablet**: 768px - 1199px (adjusted grid)
- **Mobile**: Below 768px (stacked layout, collapsible sidebar)

### Mobile Features:

- Hamburger menu toggle
- Collapsible sidebar overlay
- Touch-friendly button sizing
- Responsive tables
- Optimized font sizes

## 🔧 Technical Stack

### Frontend:

- **HTML5**: Semantic markup
- **CSS3**: Advanced styling with CSS variables
- **JavaScript ES6+**: Modern vanilla JavaScript
- **Chart.js**: Data visualization

### Data Storage:

- **localStorage**: User sessions and data persistence
- **JSON**: Data serialization format

### External APIs:

- **Open-Meteo**: Free weather forecast API
- **Chart.js CDN**: Chart rendering library

## 🚀 Getting Started

### 1. First Time Setup:

1. Open `index.html` in a web browser
2. Click "Sign Up" to create an account
3. Fill in your details and select your city/category
4. Click "Create Account"

### 2. Making a Prediction:

1. Navigate to "Prediction" page
2. Enter your organization name
3. Select your city
4. Input energy consumption data (week, month, year)
5. Click "Generate Forecast"
6. View results and trend chart

### 3. Viewing Statistics:

1. Go to "Statistics" page
2. Review your prediction history in the table
3. Check summary statistics at the top
4. Analyze by category breakdown

### 4. Accessing Admin Panel:

1. Login with an admin account
2. Click "Admin" button in header
3. View dashboard, users, and predictions
4. Manage system settings and backups

## 💡 Key Features Implemented

✅ Modern dark theme with electric blue accents
✅ Smooth sidebar navigation with animations
✅ Comprehensive authentication system
✅ Energy prediction with weather integration
✅ Statistics and analytics dashboard
✅ Admin panel with user management
✅ Responsive design for all devices
✅ Left-to-right underline hover effects
✅ 15+ Pakistani cities with coordinates
✅ Open-Meteo weather API integration
✅ User activity tracking
✅ Data backup functionality
✅ Role-based access control
✅ Smooth animations and transitions

## 🔐 Security Notes

- Passwords stored in localStorage (client-side only)
- For production, implement proper backend authentication
- Use HTTPS for data transmission
- Never store sensitive data in localStorage
- Implement proper session management
- Add CSRF protection
- Use secure authentication tokens

## 📈 Future Enhancements

- Backend server integration with database
- Email verification system
- Password reset functionality
- Social media login
- Mobile app version
- Advanced analytics with ML models
- Integration with IoT devices
- Real-time energy monitoring
- Billing integration
- API for third-party apps

## 📞 Support

For questions or issues:

- Email: support@energypredict.pk
- Phone: +92-300-XXX-XXXX
- Website: www.energypredict.pk

---

**Version**: 1.0.0  
**Last Updated**: March 2026  
**Built with**: HTML5, CSS3, JavaScript ES6+, Chart.js
