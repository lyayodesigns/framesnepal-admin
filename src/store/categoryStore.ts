import { create } from 'zustand';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  query 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category } from '../types';

interface CategoryStore {
  categories: Category[];
  loading: boolean;
  error: string | null;
  getAllCategories: () => Promise<Category[]>;
  createCategory: (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCategory: (id: string, categoryData: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  loading: false,
  error: null,

  getAllCategories: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Fetching all categories from Firestore...');
      const categoriesRef = collection(db, 'categories');
      const q = query(categoriesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      console.log(`Found ${querySnapshot.size} categories in Firestore`);
      
      if (querySnapshot.empty) {
        console.log('No categories found in the collection');
        set({ categories: [], loading: false });
        return [];
      }
      
      const categories = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Processing category ${doc.id}:`, data);
        
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        } as Category;
      });

      console.log('Processed categories:', categories);
      set({ categories, loading: false });
      return categories;
    } catch (error) {
      console.error('Error fetching all categories:', error);
      set({ error: 'Failed to fetch categories', loading: false, categories: [] });
      throw error;
    }
  },

  createCategory: async (categoryData) => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const newCategory = {
        ...categoryData,
        createdAt: now,
        updatedAt: now,
      };

      const categoriesRef = collection(db, 'categories');
      const docRef = await addDoc(categoriesRef, newCategory);

      const createdCategory: Category = {
        id: docRef.id,
        ...newCategory,
      };

      set(state => ({
        categories: [...state.categories, createdCategory],
        loading: false
      }));
    } catch (error) {
      console.error('Error creating category:', error);
      set({ error: 'Failed to create category', loading: false });
      throw error;
    }
  },

  updateCategory: async (id: string, categoryData) => {
    set({ loading: true, error: null });
    try {
      const categoryRef = doc(db, 'categories', id);
      const updateData = {
        ...categoryData,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(categoryRef, updateData);

      set(state => ({
        categories: state.categories.map(category => 
          category.id === id ? { ...category, ...updateData } : category
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating category:', error);
      set({ error: 'Failed to update category', loading: false });
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const categoryRef = doc(db, 'categories', id);
      await deleteDoc(categoryRef);

      set(state => ({
        categories: state.categories.filter(category => category.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting category:', error);
      set({ error: 'Failed to delete category', loading: false });
      throw error;
    }
  },
}));
