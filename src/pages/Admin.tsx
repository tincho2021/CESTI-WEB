import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { Product } from '../types';
import { LogIn, Plus, Trash2, Edit2, Check, X, Upload, Eye, EyeOff, Settings, AlertTriangle, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Admin = () => {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('cesti_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Products State
  const { products, addProduct, removeProduct, updateProduct } = useProducts();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formCategory, setFormCategory] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSmartReady, setFormSmartReady] = useState(false);
  const [formStock, setFormStock] = useState(1);
  const [formSpecs, setFormSpecs] = useState<[string, string][]>([['', '']]);

  // Handle Login
  // Secret credentials
  const SECRET_USER = 'admin@cesti.com.ar';
  const SECRET_PASS = 'CestiSecreto2026';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === SECRET_USER && password === SECRET_PASS) {
      setIsLoggedIn(true);
      sessionStorage.setItem('cesti_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Usuario o contraseña incorrectos. Revisa las credenciales de prueba provistas.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('cesti_admin_auth');
  };

  // Convert uploaded image to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditMode && editingProduct) {
          setEditingProduct({ ...editingProduct, image: reader.result as string });
        } else {
          setFormImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Specs helper functions
  const addSpecRow = () => {
    setFormSpecs([...formSpecs, ['', '']]);
  };

  const removeSpecRow = (index: number) => {
    setFormSpecs(formSpecs.filter((_, i) => i !== index));
  };

  const updateSpecKey = (index: number, key: string) => {
    const next = [...formSpecs];
    next[index][0] = key;
    setFormSpecs(next);
  };

  const updateSpecValue = (index: number, val: string) => {
    const next = [...formSpecs];
    next[index][1] = val;
    setFormSpecs(next);
  };

  const resetForm = () => {
    setFormName('');
    setFormPrice(0);
    setFormCategory('');
    setFormImage('');
    setFormDescription('');
    setFormSmartReady(false);
    setFormStock(1);
    setFormSpecs([['', '']]);
    setIsAdding(false);
    setEditingProduct(null);
  };

  // Create Product Submit
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formPrice <= 0 || !formCategory) {
      alert('Por favor complete los campos obligatorios: Nombre, Precio y Categoría.');
      return;
    }

    // Build specs Record
    const specsRecord: Record<string, string> = {};
    formSpecs.forEach(([k, v]) => {
      if (k.trim() && v.trim()) {
        specsRecord[k.trim()] = v.trim();
      }
    });

    addProduct({
      name: formName.toUpperCase(),
      price: Number(formPrice),
      category: formCategory,
      image: formImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
      description: formDescription,
      smartReady: formSmartReady,
      stock: Number(formStock),
      specs: specsRecord,
    });

    resetForm();
  };

  // Update Product Submit
  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateProduct(editingProduct);
    resetForm();
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setIsAdding(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 max-w-md w-full p-8 md:p-10 shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto mb-4 rounded-sm">
              <Settings className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold tracking-tighter text-gray-900 uppercase">CESTI ADMIN</h2>
            <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-bold">Acceso Confidencial</p>
          </div>

          {/* Secure Hint Alert */}
          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded-sm text-sm text-red-900">
            <div className="flex items-center space-x-2 font-bold mb-1">
              <Key className="w-4 h-4 text-red-600 shrink-0" />
              <span>Credenciales Oficiales de CESTI:</span>
            </div>
            <p className="font-mono text-xs mt-1">
              <span className="font-bold">Usuario:</span> {SECRET_USER}<br/>
              <span className="font-bold">Contraseña:</span> {SECRET_PASS}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Usuario (Email)</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ejemplo@cesti.com.ar"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Contraseña Secreta</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="text-red-600 text-xs font-bold bg-red-50 p-2 border border-red-100 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-colors flex items-center justify-center space-x-3 rounded-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar al Sistema</span>
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Dashboard */}
        <div className="bg-white border border-gray-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 shadow-sm rounded-sm">
          <div>
            <div className="flex items-center space-x-2 text-red-600 mb-1">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">SISTEMA ADMINISTRATIVO ACTIVO</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-gray-900 uppercase">CESTI CONTROL PANEL</h1>
            <p className="text-gray-500 text-sm">Gestiona el catálogo de productos disponibles en tiempo real con almacenamiento local persistente.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-colors flex items-center space-x-2 rounded-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Producto</span>
            </button>
            <button
              onClick={handleLogout}
              className="border border-gray-300 text-gray-700 px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-all rounded-sm cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-tighter text-gray-900 flex items-center space-x-2">
              <span>Listado de Componentes ({products.length})</span>
            </h2>

            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-500">
                      <th className="p-4">Foto</th>
                      <th className="p-4">Nombre / Categoría</th>
                      <th className="p-4 text-right">Precio</th>
                      <th className="p-4 text-center">Stock</th>
                      <th className="p-4 text-center">Smart</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover border border-gray-100 rounded-sm bg-gray-50"
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900 truncate max-w-xs">{product.name}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{product.category}</div>
                        </td>
                        <td className="p-4 text-right font-bold text-gray-900">${product.price}</td>
                        <td className="p-4 text-center">
                          <span className={`${product.stock <= 5 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {product.smartReady ? (
                            <span className="inline-block bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded-sm">SI</span>
                          ) : (
                            <span className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-sm">NO</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => startEdit(product)}
                              className="p-2 border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-500 transition-colors rounded"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Seguro que desea eliminar "${product.name}"?`)) {
                                  removeProduct(product.id);
                                }
                              }}
                              className="p-2 border border-gray-200 text-gray-600 hover:text-white hover:bg-black hover:border-black transition-colors rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 font-bold">
                          No hay productos en el catálogo
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Form Side Drawer/Card */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {isAdding && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white border border-gray-200 p-8 shadow-md rounded-sm space-y-6"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold uppercase tracking-tight text-gray-900">NUEVO PRODUCTO</h3>
                    <button onClick={resetForm} className="text-gray-400 hover:text-black">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Nombre del Componente *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ej. TABLERO DE CONTROL"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Precio ($USD) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formPrice || ''}
                          onChange={(e) => setFormPrice(Number(e.target.value))}
                          placeholder="120"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Stock Inicial</label>
                        <input
                          type="number"
                          min="1"
                          value={formStock}
                          onChange={(e) => setFormStock(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Categoría *</label>
                      <select
                        required
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-xs font-bold uppercase"
                      >
                        <option value="">Seleccionar Categoría</option>
                        <option value="Tableros de Control">Tableros de Control</option>
                        <option value="Sistemas de Seguridad">Sistemas de Seguridad</option>
                        <option value="Control de Despacho">Control de Despacho</option>
                        <option value="Dispositivos de Medida">Dispositivos de Medida</option>
                        <option value="Sondas de Medida">Sondas de Medida</option>
                        <option value="Sensores">Sensores</option>
                        <option value="Reguladores">Reguladores</option>
                        <option value="Accesorios de Tanque">Accesorios de Tanque</option>
                      </select>
                    </div>

                    {/* Image Area */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Imágen del Producto</label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <label className="cursor-pointer bg-black text-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors rounded-sm flex items-center space-x-2">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e)}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                            {formImage ? 'Foto cargada con éxito' : 'Sin archivo (se usará una por defecto)'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formImage}
                          onChange={(e) => setFormImage(e.target.value)}
                          placeholder="O pegue una URL de imagen externa"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-xs"
                        />
                        {formImage && (
                          <div className="border border-gray-100 p-2 bg-gray-50 rounded">
                            <img src={formImage} alt="Preview" className="h-20 w-auto mx-auto object-contain rounded" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Descripción Española</label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Descripción industrial del componente..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-sm resize-none"
                      />
                    </div>

                    {/* Dynamic Specs Editor */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Especificaciones Técnicas</label>
                        <button
                          type="button"
                          onClick={addSpecRow}
                          className="text-[10px] text-red-600 font-bold hover:underline"
                        >
                          + Añadir Fila
                        </button>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto p-1 border border-gray-50 rounded">
                        {formSpecs.map(([k, v], idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Propiedad"
                              value={k}
                              onChange={(e) => updateSpecKey(idx, e.target.value)}
                              className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm text-xs focus:outline-none focus:border-red-600"
                            />
                            <input
                              type="text"
                              placeholder="Valor"
                              value={v}
                              onChange={(e) => updateSpecValue(idx, e.target.value)}
                              className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm text-xs focus:outline-none focus:border-red-600"
                            />
                            <button
                              type="button"
                              onClick={() => removeSpecRow(idx)}
                              className="text-gray-400 hover:text-black"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <input
                        type="checkbox"
                        id="smartReady"
                        checked={formSmartReady}
                        onChange={(e) => setFormSmartReady(e.target.checked)}
                        className="w-4 h-4 accent-red-600"
                      />
                      <label htmlFor="smartReady" className="text-xs font-bold uppercase tracking-widest text-gray-500 cursor-pointer">
                        Compatible con Ecosistema Smart (IoT)
                      </label>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 bg-red-600 text-white py-3 font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors rounded-sm cursor-pointer"
                      >
                        Crear Producto
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="border border-gray-200 text-gray-500 px-4 py-3 font-bold uppercase tracking-widest text-xs hover:text-black rounded-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {editingProduct && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white border border-gray-200 p-8 shadow-md rounded-sm space-y-6"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold uppercase tracking-tight text-gray-900">MODIFICAR PRODUCTO</h3>
                    <button onClick={resetForm} className="text-gray-400 hover:text-black">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateProduct} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Nombre del Componente</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-sm font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Precio ($USD) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={editingProduct.price}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Stock Disponible</label>
                        <input
                          type="number"
                          min="0"
                          value={editingProduct.stock}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Categoría *</label>
                      <select
                        required
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-xs font-bold uppercase"
                      >
                        <option value="Tableros de Control">Tableros de Control</option>
                        <option value="Sistemas de Seguridad">Sistemas de Seguridad</option>
                        <option value="Control de Despacho">Control de Despacho</option>
                        <option value="Dispositivos de Medida">Dispositivos de Medida</option>
                        <option value="Sondas de Medida">Sondas de Medida</option>
                        <option value="Sensores">Sensores</option>
                        <option value="Reguladores">Reguladores</option>
                        <option value="Accesorios de Tanque">Accesorios de Tanque</option>
                      </select>
                    </div>

                    {/* Image Edit */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Foto / Recurso Gráfico</label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <label className="cursor-pointer bg-black text-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors rounded-sm flex items-center space-x-2">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Cargar Nueva Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, true)}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          value={editingProduct.image}
                          onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                          placeholder="Pegar URL de imágen"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-xs"
                        />
                        <div className="border border-gray-100 p-2 bg-gray-50 rounded">
                          <img src={editingProduct.image} alt="Preview" className="h-20 w-auto mx-auto object-contain rounded" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Descripción</label>
                      <textarea
                        rows={3}
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-red-600 text-sm resize-none"
                      />
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <input
                        type="checkbox"
                        id="editSmartReady"
                        checked={editingProduct.smartReady}
                        onChange={(e) => setEditingProduct({ ...editingProduct, smartReady: e.target.checked })}
                        className="w-4 h-4 accent-red-600"
                      />
                      <label htmlFor="editSmartReady" className="text-xs font-bold uppercase tracking-widest text-gray-500 cursor-pointer">
                        Compatible con Ecosistema Smart (IoT)
                      </label>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 bg-black text-white py-3 font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-colors rounded-sm cursor-pointer"
                      >
                        Guardar Cambios
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="border border-gray-200 text-gray-500 px-4 py-3 font-bold uppercase tracking-widest text-xs hover:text-black rounded-sm"
                      >
                        Descartar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {!isAdding && !editingProduct && (
                <div className="bg-gray-100 border border-gray-200 p-8 text-center rounded-sm">
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center mx-auto mb-4 rounded-sm text-gray-400">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2">Consola Lateral Cerrada</h4>
                  <p className="text-xs text-gray-400">Haz clic en "Agregar Producto" o edita un componente existente para abrir su ficha de configuración técnica.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Admin;
