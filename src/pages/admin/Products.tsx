import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from '@firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Product } from '../../types';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/simpleAuthStore';
import { useCategoryStore } from '../../store/categoryStore';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { user, initialized } = useAuthStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const { categories, getAllCategories } = useCategoryStore();
  
  // Delete confirmation modal state - implemented custom modal instead of browser confirm dialog
  // This fixes the non-functional delete button by using a similar approach to FrameManagement page
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    sizes: [] as Array<{ dimensions: string; price: string }>,
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [newSize, setNewSize] = useState<{ dimensions: string; price: string }>({ dimensions: '', price: '' });

  useEffect(() => {
    fetchProducts();
    getAllCategories();
  }, [getAllCategories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Clear the previous image URL from form data
      setFormData(prev => ({ ...prev, image: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setUploadingImage(true);

    try {
      let imageUrl = formData.image;
      if (selectedImage) {
        const storageRef = ref(storage, `products/${selectedImage.name}-${Date.now()}`);
        const uploadResult = await uploadBytes(storageRef, selectedImage);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image: imageUrl,
        category: formData.category,
        sizes: formData.sizes.map(s => ({
          dimensions: s.dimensions,
          price: parseFloat(s.price)
        })),
        updatedAt: new Date().toISOString(),
      };
      
      // Note: New categories should be created through Category Management

      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, {
          ...productData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'products'), productData);
      }

      // Reset form and states
      setFormData({
        name: '',
        description: '',
        price: '',
        image: '',
        category: '',
        sizes: [],
      });
      setSelectedImage(null);
      setPreviewUrl('');
      setNewSize({ dimensions: '', price: '' });
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'products', productToDelete));
      fetchProducts();
      setError(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      category: product.category,
      sizes: (product.sizes || []).map((s) => ({ dimensions: s.dimensions, price: String(s.price) })),
    });
    setPreviewUrl(product.image);
    setShowAddForm(true); // Show the form when editing
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsList = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          price: typeof data.price === 'number' ? data.price : 0,
          image: data.image || '',
          category: data.category || '',
          sizes: Array.isArray(data.sizes)
            ? (data.sizes as any[]).map((s) => ({
                dimensions: String(s.dimensions || ''),
                price: typeof s.price === 'number' ? s.price : parseFloat(String(s.price || 0))
              }))
            : [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        } as Product;
      });
      setProducts(productsList);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (initialized && !user) {
    return <div className="p-4">You must be logged in to view this page.</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Products</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Add a new product
          </button>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

      {(showAddForm || editingProduct) && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="mt-1 block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    No categories available. Create categories in Category Management first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Image</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Upload className="h-5 w-5 inline-block mr-2" />
                    Choose Image
                  </label>
                </div>
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded-lg" />
                )}
              </div>

              {/* Sizes with per-size pricing */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Frame Sizes and Prices</label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <input
                      type="text"
                      placeholder="Dimensions (e.g. 8x10 in)"
                      value={newSize.dimensions}
                      onChange={(e) => setNewSize({ ...newSize, dimensions: e.target.value })}
                      className="mt-1 block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Price"
                      value={newSize.price}
                      onChange={(e) => setNewSize({ ...newSize, price: e.target.value })}
                      className="mt-1 block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newSize.dimensions.trim() || newSize.price === '') return;
                        setFormData({
                          ...formData,
                          sizes: [...formData.sizes, { dimensions: newSize.dimensions.trim(), price: newSize.price }],
                        });
                        setNewSize({ dimensions: '', price: '' });
                      }}
                      className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    >
                      Add Size
                    </button>
                  </div>
                </div>

                {formData.sizes.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-2" />
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.sizes.map((s, idx) => (
                          <tr key={`${s.dimensions}-${idx}`}>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={s.dimensions}
                                onChange={(e) => {
                                  const sizes = [...formData.sizes];
                                  sizes[idx] = { ...sizes[idx], dimensions: e.target.value };
                                  setFormData({ ...formData, sizes });
                                }}
                                className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={s.price}
                                onChange={(e) => {
                                  const sizes = [...formData.sizes];
                                  sizes[idx] = { ...sizes[idx], price: e.target.value };
                                  setFormData({ ...formData, sizes });
                                }}
                                className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, sizes: formData.sizes.filter((_, i) => i !== idx) });
                                }}
                                className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProduct(null);
                  setFormData({ name: '', description: '', price: '', image: '', category: '', sizes: [] });
                  setPreviewUrl('');
                  setSelectedImage(null);
                }}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingImage}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {uploadingImage ? 'Uploading...' : editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg overflow-hidden shadow-sm"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-medium text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">NPR {Number(product.price).toFixed(2)}</span>
                <span className="text-sm text-gray-500">{product.category}</span>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Product</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this product? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
