import pytesseract
from PIL import Image
import cv2
import numpy as np
import re
import os

# Configure Tesseract path (Windows)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class PrescriptionOCRService:
    """Extract medicine names from prescription images and PDFs"""
    
    def __init__(self, medicines_list):
        # Store medicine names for matching
        self.medicine_names = set([med['name'].lower() for med in medicines_list])
        print(f"✓ OCR service initialized with {len(self.medicine_names)} medicine names")
        
    def preprocess_image(self, image_path):
        """Preprocess image for better OCR"""
        try:
            img = cv2.imread(image_path)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            denoised = cv2.fastNlMeansDenoising(gray)
            _, threshold = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            return threshold
        except Exception as e:
            print(f"Preprocessing error: {e}")
            return cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF"""
        try:
            from pdf2image import convert_from_path
            
            print("Converting PDF to images...")
            images = convert_from_path(pdf_path, dpi=300)
            
            text = ""
            for i, img in enumerate(images):
                print(f"Processing page {i+1}/{len(images)}")
                # Convert PIL image to numpy array
                img_array = np.array(img)
                # Convert to grayscale
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
                # OCR
                page_text = pytesseract.image_to_string(gray)
                text += page_text + "\n"
            
            return text
        except ImportError:
            print("pdf2image not installed. Install with: pip install pdf2image")
            return ""
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return ""
    
    def extract_text(self, file_path):
        """Extract text from image or PDF"""
        try:
            # Check if PDF
            if file_path.lower().endswith('.pdf'):
                return self.extract_text_from_pdf(file_path)
            else:
                # Image processing
                processed_img = self.preprocess_image(file_path)
                return pytesseract.image_to_string(processed_img)
        except Exception as e:
            print(f"OCR Error: {e}")
            return ""
    
    def extract_medicine_names(self, text):
        """Extract medicine names from OCR text with balanced filtering"""
        # Split text into words
        words = re.findall(r'\b[a-zA-Z]+\b', text)
        
        found_medicines = []
        found_set = set()
        
        # Reduced exclude list - only most common non-medicine words
        exclude_words = {
            'hospital', 'patient', 'name', 'date', 'doctor', 'consultation',
            'manipal', 'jaipur', 'delhi', 'mumbai', 'bangalore', 'chennai',
            'review', 'visit', 'appointment', 'toll', 'free', 'number',
            'record', 'medical', 'officer', 'university', 'note', 'copy',
            'bring', 'blood', 'pressure', 'temperature', 'weight', 'height',
            'registered', 'office', 'address', 'phone', 'email', 'website',
            'diagnosis', 'examination', 'treatment', 'progress', 'signature',
            'stamp', 'india', 'male', 'female', 'years', 'months', 'days',
            'morning', 'afternoon', 'evening', 'night', 'before', 'after'
        }
        
        for word in words:
            word_lower = word.lower()
            
            # Skip very short words (less than 4 characters)
            if len(word_lower) < 4:
                continue
            
            # Skip excluded words
            if word_lower in exclude_words:
                continue
            
            # Exact match with medicine database
            if word_lower in self.medicine_names:
                if word not in found_set:
                    found_medicines.append(word.title())
                    found_set.add(word)
            else:
                # Balanced partial matching
                # Match if word is 4+ chars and is part of medicine name
                if len(word_lower) >= 4:
                    for med_name in self.medicine_names:
                        # Check if word starts medicine name OR is substantial part (5+ chars)
                        if (word_lower == med_name[:len(word_lower)] or  # Starts with
                            (word_lower in med_name and len(word_lower) >= 5)):  # Substantial part
                            med_title = med_name.title()
                            if med_title not in found_set:
                                found_medicines.append(med_title)
                                found_set.add(med_title)
                                break
        
        # Limit to 10 results
        filtered_results = found_medicines[:10]
        
        print(f"Found {len(filtered_results)} medicines after filtering")
        
        return filtered_results
    
    def process_prescription(self, file_path):
        """Full pipeline: image/PDF -> OCR -> medicine names"""
        print(f"Processing prescription: {file_path}")
        
        # Extract text
        text = self.extract_text(file_path)
        print(f"Extracted text length: {len(text)} characters")
        
        if len(text) > 100:
            print(f"Sample text: {text[:200]}...")
        
        # Extract medicine names
        medicines = self.extract_medicine_names(text)
        print(f"Found {len(medicines)} medicines: {medicines}")
        
        return {
            'extracted_text': text[:500],  # First 500 chars for debugging
            'medicines_found': medicines,
            'count': len(medicines)
        }
