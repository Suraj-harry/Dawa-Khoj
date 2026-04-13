import pandas as pd
import json
import re
from pathlib import Path

class MedicineDataProcessor:
    """Process and prepare medicine datasets"""
    
    def __init__(self, dataset1_path, dataset2_path):
        self.dataset1_path = dataset1_path
        self.dataset2_path = dataset2_path
        self.medicines = []
    
    def extract_active_ingredient(self, composition):
        """Extract active ingredient from composition string"""
        if pd.isna(composition) or composition == '':
            return None
        
        # Remove dosage information
        ingredients = re.split(r'[+,/]', str(composition))
        cleaned = []
        for ing in ingredients:
            cleaned_ing = re.sub(r'\s*[\(\[]?\d+\.?\d*\s*(mg|ml|mcg|g|%|IU)[\)\]]?', '', ing)
            cleaned_ing = cleaned_ing.strip()
            if cleaned_ing:
                cleaned.append(cleaned_ing)
        
        return ' + '.join(cleaned) if cleaned else None
    
    def process_datasets(self):
        """Load and process both datasets"""
        print("Loading datasets...")
        
        # Load dataset 1
        df1 = pd.read_csv(self.dataset1_path)
        df1['combined_composition'] = df1['short_composition1'].fillna('') + ' ' + \
                                      df1['short_composition2'].fillna('')
        df1['active_ingredient'] = df1['combined_composition'].apply(
            self.extract_active_ingredient
        )
        
        # Handle price column
        price_col = 'price(₹)' if 'price(₹)' in df1.columns else 'price'
        
        df1_subset = df1[['name', 'active_ingredient', price_col, 
                          'manufacturer_name', 'type']].copy()
        df1_subset.columns = ['medicine_name', 'active_ingredient', 'price', 
                              'manufacturer', 'type']
        
        # Load dataset 2
        df2 = pd.read_csv(self.dataset2_path)
        df2['active_ingredient'] = df2['salt_composition'].apply(
            self.extract_active_ingredient
        )
        
        df2_subset = df2[['product_name', 'active_ingredient', 
                          'product_price', 'product_manufactured']].copy()
        df2_subset.columns = ['medicine_name', 'active_ingredient', 'price', 
                              'manufacturer']
        df2_subset['type'] = 'various'
        
        # Combine datasets
        combined = pd.concat([df1_subset, df2_subset], ignore_index=True)
        combined = combined.dropna(subset=['active_ingredient'])
        
        # Clean price
        combined['price'] = pd.to_numeric(
            combined['price'].astype(str).str.replace('₹', '').str.replace(',', ''), 
            errors='coerce'
        )
        combined = combined[combined['price'] > 0]
        
        # Remove duplicates
        combined = combined.drop_duplicates(subset=['medicine_name', 'active_ingredient'])
        
        print(f"Processed {len(combined)} medicines")
        return combined
    
    def create_searchable_index(self, df):
        """Create searchable medicine index"""
        medicines_list = []
        
        for idx, row in df.iterrows():
            medicine = {
                'id': idx,
                'name': row['medicine_name'],
                'active_ingredient': row['active_ingredient'],
                'price': float(row['price']) if pd.notna(row['price']) else 0,
                'manufacturer': row['manufacturer'],
                'type': row.get('type', 'general'),
                'search_text': f"{row['medicine_name']} {row['active_ingredient']}".lower()
            }
            medicines_list.append(medicine)
        
        return medicines_list
    
    def save_processed_data(self, output_path):
        """Process and save data to JSON"""
        df = self.process_datasets()
        medicines = self.create_searchable_index(df)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(medicines, f, indent=2, ensure_ascii=False)
        
        print(f"Saved {len(medicines)} medicines to {output_path}")
        return medicines

# Run this once to preprocess data
if __name__ == "__main__":
    from config import Config
    
    processor = MedicineDataProcessor(
        Config.DATASET1_PATH,
        Config.DATASET2_PATH
    )
    processor.save_processed_data(Config.PROCESSED_DATA_PATH)
