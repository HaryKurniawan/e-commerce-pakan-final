import React, { useState, useEffect, useRef } from 'react';
import '../styles/ProductForm.css'

const ProductForm = ({ onSubmit, editingProduct, onCancelEdit, loading }) => {
  const [formData, setFormData] = useState({
    nama_produk: '',
    harga: '',
    stok: '',
    detail_produk: '',
    foto_file: null,
    foto_file_1: null,
    foto_file_2: null
  });

  const [previewUrls, setPreviewUrls] = useState({
    foto_file: '',
    foto_file_1: '',
    foto_file_2: ''
  });

  const [existingPhotos, setExistingPhotos] = useState({
    url_foto: '',
    url_foto_1: '',
    url_foto_2: ''
  });

  // Add refs for file inputs
  const fileInputRefs = {
    foto_file: useRef(null),
    foto_file_1: useRef(null),
    foto_file_2: useRef(null)
  };

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        nama_produk: editingProduct.nama_produk,
        harga: editingProduct.harga.toString(),
        stok: editingProduct.stok.toString(),
        detail_produk: editingProduct.detail_produk,
        foto_file: null,
        foto_file_1: null,
        foto_file_2: null
      });

      // Set existing photos for display
      setExistingPhotos({
        url_foto: editingProduct.product_photos?.[0]?.url_foto || '',
        url_foto_1: editingProduct.product_photos?.[0]?.url_foto_1 || '',
        url_foto_2: editingProduct.product_photos?.[0]?.url_foto_2 || ''
      });

      // Reset preview URLs when editing
      setPreviewUrls({
        foto_file: '',
        foto_file_1: '',
        foto_file_2: ''
      });

      // Reset file inputs
      Object.values(fileInputRefs).forEach(ref => {
        if (ref.current) {
          ref.current.value = '';
        }
      });
    } else {
      setFormData({
        nama_produk: '',
        harga: '',
        stok: '',
        detail_produk: '',
        foto_file: null,
        foto_file_1: null,
        foto_file_2: null
      });
      
      setExistingPhotos({
        url_foto: '',
        url_foto_1: '',
        url_foto_2: ''
      });
      
      setPreviewUrls({
        foto_file: '',
        foto_file_1: '',
        foto_file_2: ''
      });

      // Reset file inputs
      Object.values(fileInputRefs).forEach(ref => {
        if (ref.current) {
          ref.current.value = '';
        }
      });
    }
  }, [editingProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare form data for submission
    const submitData = {
      nama_produk: formData.nama_produk,
      harga: parseInt(formData.harga),
      stok: parseInt(formData.stok),
      detail_produk: formData.detail_produk
    };

    // Add file data if files are selected
    if (formData.foto_file) {
      submitData.foto_file = formData.foto_file;
    }
    if (formData.foto_file_1) {
      submitData.foto_file_1 = formData.foto_file_1;
    }
    if (formData.foto_file_2) {
      submitData.foto_file_2 = formData.foto_file_2;
    }

    await onSubmit(submitData);
    
    // Reset form after successful submission
    setFormData({
      nama_produk: '',
      harga: '',
      stok: '',
      detail_produk: '',
      foto_file: null,
      foto_file_1: null,
      foto_file_2: null
    });
    
    setPreviewUrls({
      foto_file: '',
      foto_file_1: '',
      foto_file_2: ''
    });
    
    setExistingPhotos({
      url_foto: '',
      url_foto_1: '',
      url_foto_2: ''
    });

    // Reset file inputs after submission
    Object.values(fileInputRefs).forEach(ref => {
      if (ref.current) {
        ref.current.value = '';
      }
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Update form data
      setFormData({
        ...formData,
        [name]: file
      });
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrls(prev => ({
        ...prev,
        [name]: previewUrl
      }));
    } else {
      // File was removed
      setFormData({
        ...formData,
        [name]: null
      });
      
      // Remove preview URL
      if (previewUrls[name]) {
        URL.revokeObjectURL(previewUrls[name]);
      }
      
      setPreviewUrls(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCancel = () => {
    // Cleanup preview URLs
    Object.values(previewUrls).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    
    onCancelEdit();
    
    setFormData({
      nama_produk: '',
      harga: '',
      stok: '',
      detail_produk: '',
      foto_file: null,
      foto_file_1: null,
      foto_file_2: null
    });
    
    setPreviewUrls({
      foto_file: '',
      foto_file_1: '',
      foto_file_2: ''
    });
    
    setExistingPhotos({
      url_foto: '',
      url_foto_1: '',
      url_foto_2: ''
    });

    // Reset file inputs when canceling
    Object.values(fileInputRefs).forEach(ref => {
      if (ref.current) {
        ref.current.value = '';
      }
    });
  };

  const removeFile = (fileName) => {
    if (previewUrls[fileName]) {
      URL.revokeObjectURL(previewUrls[fileName]);
    }
    
    setFormData({
      ...formData,
      [fileName]: null
    });
    
    setPreviewUrls(prev => ({
      ...prev,
      [fileName]: ''
    }));

    // Reset specific file input
    if (fileInputRefs[fileName].current) {
      fileInputRefs[fileName].current.value = '';
    }
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  return (
    <div>
      <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
      <form onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          name="nama_produk"
          placeholder="Product Name"
          value={formData.nama_produk}
          onChange={handleChange}
          required
        />
        <input
          className="input"
          type="number"
          name="harga"
          placeholder="Price"
          value={formData.harga}
          onChange={handleChange}
          min="0"
          required
        />
        <input
          className="input"
          type="number"
          name="stok"
          placeholder="Stock"
          value={formData.stok}
          onChange={handleChange}
          min="0"
          required
        />
        <textarea
          className="textarea"
          name="detail_produk"
          placeholder="Product Description"
          value={formData.detail_produk}
          onChange={handleChange}
          required
        />
        
        {/* Photo Upload Fields */}
        <div className="photo-section">
          <h4>Product Photos</h4>
          
          {/* Main Photo */}
          <div className="photo-upload-item">
            <label>Main Photo:</label>
            <input
              ref={fileInputRefs.foto_file}
              className="input"
              type="file"
              name="foto_file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {formData.foto_file && (
              <button 
                type="button" 
                className="remove-file-btn"
                onClick={() => removeFile('foto_file')}
              >
                Remove
              </button>
            )}
          </div>

          {/* Additional Photo 1 */}
          <div className="photo-upload-item">
            <label>Additional Photo 1:</label>
            <input
              ref={fileInputRefs.foto_file_1}
              className="input"
              type="file"
              name="foto_file_1"
              accept="image/*"
              onChange={handleFileChange}
            />
            {formData.foto_file_1 && (
              <button 
                type="button" 
                className="remove-file-btn"
                onClick={() => removeFile('foto_file_1')}
              >
                Remove
              </button>
            )}
          </div>

          {/* Additional Photo 2 */}
          <div className="photo-upload-item">
            <label>Additional Photo 2:</label>
            <input
              ref={fileInputRefs.foto_file_2}
              className="input"
              type="file"
              name="foto_file_2"
              accept="image/*"
              onChange={handleFileChange}
            />
            {formData.foto_file_2 && (
              <button 
                type="button" 
                className="remove-file-btn"
                onClick={() => removeFile('foto_file_2')}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Photo Preview */}
        {(previewUrls.foto_file || previewUrls.foto_file_1 || previewUrls.foto_file_2 || 
          existingPhotos.url_foto || existingPhotos.url_foto_1 || existingPhotos.url_foto_2) && (
          <div className="photo-preview">
            <h4>Photo Preview</h4>
            <div className="preview-grid">
              {/* Main Photo Preview */}
              {(previewUrls.foto_file || existingPhotos.url_foto) && (
                <div className="preview-item">
                  <img 
                    src={previewUrls.foto_file || existingPhotos.url_foto} 
                    alt="Main preview" 
                  />
                  <span>Main Photo {previewUrls.foto_file && '(New)'}</span>
                </div>
              )}
              
              {/* Additional Photo 1 Preview */}
              {(previewUrls.foto_file_1 || existingPhotos.url_foto_1) && (
                <div className="preview-item">
                  <img 
                    src={previewUrls.foto_file_1 || existingPhotos.url_foto_1} 
                    alt="Additional preview 1" 
                  />
                  <span>Photo 1 {previewUrls.foto_file_1 && '(New)'}</span>
                </div>
              )}
              
              {/* Additional Photo 2 Preview */}
              {(previewUrls.foto_file_2 || existingPhotos.url_foto_2) && (
                <div className="preview-item">
                  <img 
                    src={previewUrls.foto_file_2 || existingPhotos.url_foto_2} 
                    alt="Additional preview 2" 
                  />
                  <span>Photo 2 {previewUrls.foto_file_2 && '(New)'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="button-group">
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Processing...' : editingProduct ? 'Update Product' : 'Add Product'}
          </button>
          {editingProduct && (
            <button 
              className="button secondary"
              type="button"
              onClick={handleCancel}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProductForm;