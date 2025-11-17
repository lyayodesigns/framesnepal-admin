import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuthStore } from '../../store/simpleAuthStore';
import { Plus, Trash2, Edit, X, Save, Image, Loader } from 'lucide-react';

interface Size {
  id: string;
  dimensions: string;
  price: number;
  description?: string;
}

interface Frame {
  id: string;
  name: string;
  image: string;
  price: number;
  description?: string;
  availableSizes: Size[];
  createdAt?: any;
  updatedAt?: any;
}

// No predefined sizes; admins can add any size with a price

export default function FrameManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newFrame, setNewFrame] = useState<Omit<Frame, 'id'>>({
    name: '',
    image: '',
    price: 0,
    description: '',
    availableSizes: []
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newSize, setNewSize] = useState<{ dimensions: string; price: string; description: string }>({ dimensions: '', price: '', description: '' });
  
  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [frameToDelete, setFrameToDelete] = useState<{ id: string; imageUrl: string } | null>(null);

  // We don't need this check anymore since PrivateRoute already handles this
  // and simpleAuthStore only has admin users
  // useEffect(() => {
  //   if (!user || user.role !== 'admin') {
  //     navigate('/');
  //   }
  // }, [user, navigate]);

  // Fetch frames from Firestore
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        setLoading(true);
        const framesCollection = collection(db, 'frames');
        const framesSnapshot = await getDocs(framesCollection);
        const framesList = framesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Frame[];
        
        // Sort frames by name
        framesList.sort((a, b) => a.name.localeCompare(b.name));
        
        setFrames(framesList);
        setError(null);
      } catch (err) {
        console.error('Error fetching frames:', err);
        setError('Failed to load frames. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFrames();
  }, []);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // Upload image to Firebase Storage
  const uploadImage = async (file: File, frameId: string): Promise<string> => {
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `frames/${frameId}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw new Error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Add new frame
  const handleAddFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFrame.name || !imageFile) {
      setError('Please provide a name and image for the frame');
      return;
    }

    try {
      setSubmitting(true);
      
      // Add document to get an ID first
      const frameData = {
        name: newFrame.name,
        price: Number(newFrame.price),
        image: '',
        description: newFrame.description || '',
        availableSizes: newFrame.availableSizes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'frames'), frameData);
      
      // Upload image with the new document ID
      const imageUrl = await uploadImage(imageFile, docRef.id);
      
      // Update the document with the image URL
      await updateDoc(doc(db, 'frames', docRef.id), {
        image: imageUrl
      });
      
      // Update local state
      setFrames(prev => [
        ...prev, 
        { 
          id: docRef.id, 
          name: newFrame.name, 
          price: Number(newFrame.price), 
          image: imageUrl,
          description: newFrame.description || '',
          availableSizes: newFrame.availableSizes
        }
      ]);
      
      // Reset form
      setNewFrame({ name: '', image: '', price: 0, description: '', availableSizes: [] });
      setImageFile(null);
      setImagePreview(null);
      setIsAdding(false);
      setError(null);
    } catch (err) {
      console.error('Error adding frame:', err);
      setError('Failed to add frame. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update existing frame
  const handleUpdateFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing || !newFrame.name) {
      setError('Please provide a name for the frame');
      return;
    }

    try {
      setSubmitting(true);
      
      const frameRef = doc(db, 'frames', isEditing);
      const updateData: any = {
        name: newFrame.name,
        price: Number(newFrame.price),
        description: newFrame.description || '',
        availableSizes: newFrame.availableSizes,
        updatedAt: serverTimestamp()
      };
      
      // If there's a new image, upload it
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile, isEditing);
        updateData.image = imageUrl;
      }
      
      await updateDoc(frameRef, updateData);
      
      // Update local state
      setFrames(prev => prev.map(frame => {
        if (frame.id === isEditing) {
          return { 
            ...frame, 
            name: newFrame.name, 
            price: Number(newFrame.price),
            image: imageFile ? updateData.image : frame.image,
            description: newFrame.description || '',
            availableSizes: newFrame.availableSizes
          };
        }
        return frame;
      }));
      
      // Reset form
      setNewFrame({ name: '', image: '', price: 0, description: '', availableSizes: [] });
      setImageFile(null);
      setImagePreview(null);
      setIsEditing(null);
      setError(null);
    } catch (err) {
      console.error('Error updating frame:', err);
      setError('Failed to update frame. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Show delete confirmation modal
  const handleDeleteFrame = (frameId: string, imageUrl: string) => {
    setFrameToDelete({ id: frameId, imageUrl });
    setShowDeleteConfirm(true);
  };

  // Actually delete the frame
  const confirmDeleteFrame = async () => {
    if (!frameToDelete) return;
    
    const { id: frameId, imageUrl } = frameToDelete;
    setShowDeleteConfirm(false);
    
    try {
      setLoading(true);
      
      // Delete document from Firestore
      await deleteDoc(doc(db, 'frames', frameId));
      
      // Try to delete image from Storage if it exists
      try {
        if (imageUrl && imageUrl.includes('firebase')) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        }
      } catch (imageErr) {
      }
      
      // Update local state
      setFrames(prev => prev.filter(frame => frame.id !== frameId));
      setError(null);
    } catch (err) {
      setError('Failed to delete frame. Please try again.');
    } finally {
      setLoading(false);
      setFrameToDelete(null);
    }
  };

  // Cancel delete confirmation
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setFrameToDelete(null);
  };

  // Start editing a frame
  const startEditing = (frame: Frame) => {
    setIsEditing(frame.id);
    setNewFrame({
      name: frame.name,
      image: frame.image,
      price: frame.price,
      description: frame.description || '',
      availableSizes: frame.availableSizes || []
    });
    setImagePreview(frame.image);
    setIsAdding(false);
  };

  // Cancel form
  const cancelForm = () => {
    setIsAdding(false);
    setIsEditing(null);
    setNewFrame({ name: '', image: '', price: 0, description: '', availableSizes: [] });
    setImageFile(null);
    setImagePreview(null);
    setError(null);
  };

  // Add, update, remove sizes in the availableSizes array
  const addSize = () => {
    if (!newSize.dimensions.trim() || newSize.price === '') return;
    const entry: Size = {
      id: `${Date.now()}`,
      dimensions: newSize.dimensions.trim(),
      price: Number(newSize.price),
      description: newSize.description.trim()
    };
    setNewFrame({
      ...newFrame,
      availableSizes: [...newFrame.availableSizes, entry]
    });
    setNewSize({ dimensions: '', price: '', description: '' });
  };
  const updateSize = (id: string, patch: Partial<Pick<Size, 'dimensions' | 'price' | 'description'>>) => {
    setNewFrame({
      ...newFrame,
      availableSizes: newFrame.availableSizes.map(s => s.id === id ? { ...s, ...patch } : s)
    });
  };
  const removeSize = (id: string) => {
    setNewFrame({
      ...newFrame,
      availableSizes: newFrame.availableSizes.filter(s => s.id !== id)
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Frame Management</h1>
        {!isAdding && !isEditing && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Frame
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || isEditing) && (
        <div className="bg-white shadow-lg rounded-xl p-8 mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isAdding ? 'Add New Frame' : 'Edit Frame'}
            </h2>
            <button
              onClick={cancelForm}
              className="text-gray-400 hover:text-gray-500 transition-colors"
              aria-label="Close form"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={isAdding ? handleAddFrame : handleUpdateFrame}>
            <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Frame Name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={newFrame.name}
                    onChange={(e) => setNewFrame({ ...newFrame, name: e.target.value })}
                    className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                    placeholder="Enter frame name"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (NPR)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-medium">रू</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    min="0"
                    step="1"
                    value={newFrame.price}
                    onChange={(e) => setNewFrame({ ...newFrame, price: Number(e.target.value) })}
                    className="block w-full pl-10 pr-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <div className="relative rounded-md shadow-sm">
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={newFrame.description}
                    onChange={(e) => setNewFrame({ ...newFrame, description: e.target.value })}
                    className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                    placeholder="Enter frame description"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frame Image
                </label>
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Frame preview"
                          className="h-40 w-40 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">Change image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 w-40 border-2 border-blue-200 border-dashed rounded-lg flex flex-col items-center justify-center bg-gray-50">
                        <Image className="h-10 w-10 text-blue-400 mb-2" />
                        <span className="text-sm text-gray-500">No image selected</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <label
                        htmlFor="frame-image"
                        className="group relative w-full flex items-center justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors duration-200"
                      >
                        <div className="space-y-1 text-center">
                          <Image className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <span className="relative font-medium text-blue-600 hover:text-blue-700 focus-within:outline-none">
                              {imageFile ? 'Replace image' : 'Upload image'}
                            </span>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <input
                          id="frame-image"
                          name="frame-image"
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleImageChange}
                          required={isAdding}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Sizes (custom)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <input
                    type="text"
                    placeholder="Dimensions (e.g. 8 x 10 in)"
                    value={newSize.dimensions}
                    onChange={(e) => setNewSize({ ...newSize, dimensions: e.target.value })}
                    className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newSize.price}
                    onChange={(e) => setNewSize({ ...newSize, price: e.target.value })}
                    className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={addSize}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Add Size
                  </button>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Description for this size (optional)"
                    value={newSize.description}
                    onChange={(e) => setNewSize({ ...newSize, description: e.target.value })}
                    className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                  />
                </div>
                {newFrame.availableSizes.length > 0 && (
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
                        {newFrame.availableSizes.map((s) => (
                          <React.Fragment key={s.id}>
                            <tr>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={s.dimensions}
                                  onChange={(e) => updateSize(s.id, { dimensions: e.target.value })}
                                  className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  value={s.price}
                                  onChange={(e) => updateSize(s.id, { price: Number(e.target.value) })}
                                  className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                                />
                              </td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeSize(s.id)}
                                  className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 flex items-center gap-1"
                                >
                                  <Trash2 className="h-4 w-4" /> Remove
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 pb-4" colSpan={3}>
                                <input
                                  type="text"
                                  placeholder="Description for this size (optional)"
                                  value={s.description || ''}
                                  onChange={(e) => updateSize(s.id, { description: e.target.value })}
                                  className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
                                />
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">Add any number of size options with prices for this frame.</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={cancelForm}
                className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                {submitting || uploadingImage ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    {uploadingImage ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isAdding ? 'Add Frame' : 'Update Frame'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Frames List */}
      {loading && !isAdding && !isEditing ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-gray-600">Loading frames...</span>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {frames.length === 0 ? (
            <div className="py-12 text-center">
              <Image className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No frames found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new frame.</p>
              {!isAdding && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Frame
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {frames.map((frame) => (
                <li key={frame.id}>
                  <div className="px-4 py-4 flex items-center sm:px-6">
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <img
                            className="h-16 w-16 rounded-md object-cover"
                            src={frame.image}
                            alt={frame.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{frame.name}</div>
                          <div className="text-sm text-gray-500">रू {frame.price.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => startEditing(frame)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFrame(frame.id, frame.image)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Frame</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this frame? This action cannot be undone.
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
                    onClick={confirmDeleteFrame}
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
    </div>
  );
}
