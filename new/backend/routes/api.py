from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
from services.search_service import MedicineSearchService
from services.ocr_service import PrescriptionOCRService
from config import Config
import os
import traceback

api_bp = Blueprint('api', __name__, url_prefix='/api')

# Configuration for file uploads
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize search service
try:
    search_service = MedicineSearchService(Config.PROCESSED_DATA_PATH)
    print(f"✓ Search service loaded successfully")
except Exception as e:
    print(f"ERROR loading search service: {e}")
    traceback.print_exc()
    search_service = None

# Initialize OCR service
try:
    if search_service:
        ocr_service = PrescriptionOCRService(search_service.medicines)
        print(f"✓ OCR service loaded successfully")
    else:
        ocr_service = None
except Exception as e:
    print(f"ERROR loading OCR service: {e}")
    traceback.print_exc()
    ocr_service = None

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ========================================
# EXISTING ROUTES (Search & Alternatives)
# ========================================

@api_bp.route('/search', methods=['GET'])
def search_medicines():
    """Search medicines by name"""
    if not search_service:
        return jsonify({'error': 'Search service not initialized'}), 500
    
    query = request.args.get('q', '')
    limit = int(request.args.get('limit', 10))
    
    try:
        results = search_service.search_by_name(query, limit)
        return jsonify({
            'query': query,
            'results': results,
            'count': len(results)
        })
    except Exception as e:
        print(f"Search error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/alternatives/<path:medicine_name>', methods=['GET'])
def get_alternatives(medicine_name):
    """Get alternative medicines"""
    if not search_service:
        return jsonify({'error': 'Search service not initialized'}), 500
    
    limit = int(request.args.get('limit', 10))
    
    try:
        print(f"Finding alternatives for: {medicine_name}")
        result = search_service.find_alternatives(medicine_name, limit)
        print(f"Found {len(result.get('alternatives', []))} alternatives")
        return jsonify(result)
    except Exception as e:
        print(f"Alternatives error: {e}")
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'original': None,
            'alternatives': [],
            'total_alternatives': 0
        }), 500

@api_bp.route('/popular', methods=['GET'])
def get_popular():
    """Get popular medicines for autocomplete"""
    if not search_service:
        return jsonify({'error': 'Search service not initialized'}), 500
    
    limit = int(request.args.get('limit', 20))
    
    try:
        medicines = search_service.get_popular_medicines(limit)
        return jsonify({
            'medicines': medicines,
            'count': len(medicines)
        })
    except Exception as e:
        print(f"Popular medicines error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    if not search_service:
        return jsonify({'error': 'Search service not initialized'}), 500
    
    try:
        total_medicines = len(search_service.medicines)
        total_ingredients = len(search_service.ingredient_index)
        
        return jsonify({
            'total_medicines': total_medicines,
            'total_unique_ingredients': total_ingredients
        })
    except Exception as e:
        print(f"Stats error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ========================================
# NEW OCR ROUTE
# ========================================

@api_bp.route('/ocr/prescription', methods=['POST'])
def process_prescription():
    """Process prescription image and extract medicine names"""
    if not ocr_service:
        return jsonify({'error': 'OCR service not initialized'}), 500
    
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    # Check if filename is empty
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check file type and process
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        try:
            # Save file temporarily
            file.save(filepath)
            print(f"Processing prescription: {filename}")
            
            # Process prescription with OCR
            result = ocr_service.process_prescription(filepath)
            print(f"OCR extracted {result['count']} medicines")
            
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
            
            return jsonify(result)
            
        except Exception as e:
            # Clean up file if error occurs
            if os.path.exists(filepath):
                os.remove(filepath)
            
            print(f"OCR processing error: {e}")
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, pdf'}), 400

# ========================================
# HEALTH CHECK
# ========================================

@api_bp.route('/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        'status': 'healthy',
        'services': {
            'search': search_service is not None,
            'ocr': ocr_service is not None
        }
    })
