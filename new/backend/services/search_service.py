import json
from typing import List, Dict
import re

class MedicineSearchService:
    """Handle medicine search operations"""
    
    def __init__(self, data_path):
        with open(data_path, 'r', encoding='utf-8') as f:
            self.medicines = json.load(f)
        
        print(f"✓ Loaded {len(self.medicines)} medicines into search service")
        
        # Create ingredient index for faster lookups
        self.ingredient_index = self._create_ingredient_index()
        
        # Create name index for exact matches
        self.name_index = self._create_name_index()
    
    def _create_ingredient_index(self):
        """Create index by active ingredient for faster searching"""
        index = {}
        for med in self.medicines:
            ingredient = str(med['active_ingredient']).lower().strip()
            if ingredient not in index:
                index[ingredient] = []
            index[ingredient].append(med)
        print(f"✓ Created ingredient index with {len(index)} unique ingredients")
        return index
    
    def _create_name_index(self):
        """Create index by medicine name for exact lookups"""
        index = {}
        for med in self.medicines:
            name = str(med['name']).lower().strip()
            index[name] = med
        return index
    
    def search_by_name(self, query: str, limit: int = 10) -> List[Dict]:
        """Search medicines by name with priority ranking"""
        query = query.lower().strip()
        
        if not query:
            return []
        
        # Separate results by match quality
        exact_matches = []
        starts_with_matches = []
        word_starts_matches = []
        contains_matches = []
        
        seen_names = set()
        
        for med in self.medicines:
            name_lower = med['name'].lower()
            
            # Skip if already added
            if med['name'] in seen_names:
                continue
            
            # Exact match
            if name_lower == query:
                exact_matches.append(med)
                seen_names.add(med['name'])
            # Starts with query
            elif name_lower.startswith(query):
                starts_with_matches.append(med)
                seen_names.add(med['name'])
            # Word starts with query (e.g., "Dolo 650" matches "dolo")
            elif any(word.startswith(query) for word in name_lower.split()):
                word_starts_matches.append(med)
                seen_names.add(med['name'])
            # Contains query anywhere
            elif query in name_lower:
                contains_matches.append(med)
                seen_names.add(med['name'])
        
        # Combine results with priority: exact > starts_with > word_starts > contains
        results = exact_matches + starts_with_matches + word_starts_matches + contains_matches
        
        # Limit results
        return results[:limit]
    
    def find_alternatives(self, medicine_name: str, limit: int = 10) -> Dict:
        """Find alternative medicines with same composition"""
        medicine_name_lower = medicine_name.lower().strip()
        
        # Try exact match first
        original = self.name_index.get(medicine_name_lower)
        
        # If not found, try fuzzy search
        if not original:
            search_results = self.search_by_name(medicine_name, 1)
            if search_results:
                original = search_results[0]
            else:
                return {
                    'error': 'Medicine not found',
                    'original': None,
                    'alternatives': [],
                    'total_alternatives': 0
                }
        
        # Find medicines with same active ingredient
        ingredient = str(original['active_ingredient']).lower().strip()
        alternatives = self.ingredient_index.get(ingredient, [])
        
        # Filter out the original medicine and sort by price
        alternatives = [
            alt for alt in alternatives 
            if alt['name'].lower() != original['name'].lower()
        ]
        
        # Sort by price (ascending)
        alternatives.sort(key=lambda x: float(x.get('price', 999999)))
        
        # Calculate savings for each alternative
        original_price = float(original.get('price', 0))
        
        for alt in alternatives:
            alt_price = float(alt.get('price', 0))
            savings = original_price - alt_price
            
            alt['savings'] = savings
            alt['savings_percent'] = (savings / original_price * 100) if original_price > 0 else 0
        
        return {
            'original': original,
            'alternatives': alternatives[:limit],
            'total_alternatives': len(alternatives)
        }
    
    def get_popular_medicines(self, limit: int = 20) -> List[Dict]:
        """Get popular medicines for autocomplete"""
        # Return first N medicines (could be enhanced with popularity metrics)
        return self.medicines[:limit]
