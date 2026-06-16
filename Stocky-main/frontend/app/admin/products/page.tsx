'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Badge,
  Table,
  Form,
  InputGroup,
  Modal,
  Alert
} from 'react-bootstrap';

interface Product {
  id: number;
  name: string;
  description: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  category: string;
  barcode: string;
  location: string;
  min_stock: number;
  image_url: string;
}

interface Branch {
  id: number;
  name: string;
  address: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminProducts() {

  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const [viewMode, setViewMode] =
    useState<'table' | 'cards'>('table');

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalVariant, setModalVariant] =
    useState<'success' | 'danger'>('success');

  const [showImageModal, setShowImageModal] =
    useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string>('');

  const [user, setUser] = useState<User | null>(null);

  const [stats, setStats] = useState({
    total_products: 0,
    total_units: 0,
    total_value: 0,
    total_investment: 0,
    total_profit: 0,
    low_stock_count: 0
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const branchParam = searchParams.get('branch');

  useEffect(() => {

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData!);

    if (parsedUser.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);

    fetchBranches();

  }, []);

  useEffect(() => {

    if (selectedBranch) {
      fetchProducts();
      fetchStats();
    }

  }, [selectedBranch]);

  const fetchBranches = async () => {

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        'http://localhost:5001/api/branches',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      const branchesList = Array.isArray(data)
        ? data
        : [];

      setBranches(branchesList);

      if (branchesList.length > 0) {

        if (branchParam) {

          const branchId = parseInt(branchParam);

          const foundBranch = branchesList.find(
            b => b.id === branchId
          );

          if (foundBranch) {
            setSelectedBranch(branchId);
            setSelectedBranchName(foundBranch.name);
          }

        } else {

          setSelectedBranch(branchesList[0].id);
          setSelectedBranchName(branchesList[0].name);

        }
      }

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }
  };

  const fetchProducts = async () => {

    if (!selectedBranch) return;

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        `http://localhost:5001/api/products/branch/${selectedBranch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      setProducts(data.products || []);

    } catch (error) {

      console.error(error);

    }
  };

  const fetchStats = async () => {

    if (!selectedBranch) return;

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        `http://localhost:5001/api/stats/branch/${selectedBranch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      setStats(data);

    } catch (error) {

      console.error(error);

    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);

    const formData = new FormData();

    formData.append('file', file);

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        `http://localhost:5001/api/branches/${selectedBranch}/upload-excel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await res.json();

      if (res.ok) {

        setModalMessage(
          data.message ||
            'Archivo procesado correctamente'
        );

        setModalVariant('success');
        setShowModal(true);

        fetchProducts();
        fetchStats();

      } else {

        setModalMessage(
          data.error ||
            'Error al subir el archivo'
        );

        setModalVariant('danger');
        setShowModal(true);

      }

    } catch (error) {

      console.error(error);

      setModalMessage(
        'Error de conexión con el servidor'
      );

      setModalVariant('danger');
      setShowModal(true);

    } finally {

      setUploading(false);

    }
  };

  const updateStock = async (
    productId: number,
    newStock: number
  ) => {

    if (newStock < 0) return;

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        `http://localhost:5001/api/products/${productId}/stock`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            stock: newStock,
            branchId: selectedBranch
          })
        }
      );

      if (res.ok) {

        fetchProducts();
        fetchStats();

      }

    } catch (error) {

      console.error(error);

    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];

    if (file) {

      setSelectedFile(file);

      const reader = new FileReader();

      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };

      reader.readAsDataURL(file);

    }
  };

  const handleUploadImage = async () => {

    if (!selectedProduct || !selectedFile) {

      setModalMessage(
        'Selecciona una imagen primero'
      );

      setModalVariant('danger');
      setShowModal(true);

      return;

    }

    setUploadingImage(true);

    const token = localStorage.getItem('token');

    const formData = new FormData();

    formData.append('image', selectedFile);
    formData.append(
      'branchId',
      String(selectedBranch)
    );

    try {

      const res = await fetch(
        `http://localhost:5001/api/products/${selectedProduct.id}/upload-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await res.json();

      if (res.ok) {

        setModalMessage(
          'Imagen subida correctamente'
        );

        setModalVariant('success');
        setShowModal(true);

        setShowImageModal(false);

        setSelectedFile(null);
        setImagePreview('');

        fetchProducts();

      } else {

        setModalMessage(
          data.error ||
            'Error al subir la imagen'
        );

        setModalVariant('danger');
        setShowModal(true);

      }

    } catch (error) {

      console.error(error);

      setModalMessage('Error de conexión');

      setModalVariant('danger');
      setShowModal(true);

    } finally {

      setUploadingImage(false);

    }
  };

  const handleUpdateImageUrl = async () => {

    if (!selectedProduct) return;

    setUploadingImage(true);

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        `http://localhost:5001/api/products/${selectedProduct.id}/image`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            image_url: imageUrl,
            branchId: selectedBranch
          })
        }
      );

      const data = await res.json();

      if (res.ok) {

        setModalMessage(
          'Imagen actualizada correctamente'
        );

        setModalVariant('success');
        setShowModal(true);

        setShowImageModal(false);

        fetchProducts();

      } else {

        setModalMessage(
          data.error ||
            'Error al actualizar la imagen'
        );

        setModalVariant('danger');
        setShowModal(true);

      }

    } catch (error) {

      setModalMessage('Error de conexión');

      setModalVariant('danger');
      setShowModal(true);

    } finally {

      setUploadingImage(false);

    }
  };

  const handleDeleteImage = async (
    product: Product
  ) => {

    if (
      !confirm(
        `¿Eliminar la imagen del producto "${product.name}"?`
      )
    ) return;

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        `http://localhost:5001/api/products/${product.id}/delete-image`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            branchId: selectedBranch
          })
        }
      );

      if (res.ok) {

        setModalMessage(
          'Imagen eliminada correctamente'
        );

        setModalVariant('success');
        setShowModal(true);

        fetchProducts();

      } else {

        setModalMessage(
          'Error al eliminar la imagen'
        );

        setModalVariant('danger');
        setShowModal(true);

      }

    } catch (error) {

      setModalMessage('Error de conexión');

      setModalVariant('danger');
      setShowModal(true);

    }
  };

  const openImageModal = (product: Product) => {

    setSelectedProduct(product);

    setImageUrl(product.image_url || '');

    setSelectedFile(null);
    setImagePreview('');

    setShowImageModal(true);

  };

  const handleBranchChange = (
    branchId: number,
    branchName: string
  ) => {

    setSelectedBranch(branchId);
    setSelectedBranchName(branchName);

    router.push(
      `/admin/products?branch=${branchId}`,
      { scroll: false }
    );
  };

  const getStockBadge = (
    stock: number,
    minStock: number
  ) => {

    if (stock === 0) {
      return (
        <Badge bg="danger">
          Agotado
        </Badge>
      );
    }

    if (stock <= minStock) {
      return (
        <Badge
          bg="warning"
          text="dark"
        >
          Bajo ({stock})
        </Badge>
      );
    }

    return (
      <Badge bg="success">
        En stock ({stock})
      </Badge>
    );
  };

  const getProductIcon = (
    category: string
  ) => {

    const icons: {
      [key: string]: string
    } = {
      Medicamentos: '💊',
      Vitaminas: '🍊',
      Insumos: '🩹',
      Limpieza: '🧴',
      Cuidado: '🧴',
      Equipos: '🌡️',
      Protección: '😷',
      General: '📦'
    };

    return icons[category] || '📦';

  };

  const categories = [
    'all',
    ...new Set(
      products.map(p => p.category)
    )
  ];

  const filteredProducts =
    products.filter((p) => {

      const matchesSearch =
        p.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        p.barcode
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesCategory =
        category === 'all' ||
        p.category === category;

      return (
        matchesSearch &&
        matchesCategory
      );

    });

  if (loading) {

    return (
      <div className="loading-screen">
        <Spinner
          animation="border"
          variant="light"
        />
      </div>
    );

  }

  return (
    <>
      <div className="hero-section">

        {/* NAVBAR */}
        <div className="panel-top-section">

          <div className="panel-left-section">

            <div className="panel-logo-box">

              <div className="panel-logo-wrapper">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={34}
                  height={34}
                />
              </div>

              <div>
                <h5 className="fw-bold mb-0 text-white">
                  Stocky
                </h5>

                <small className="text-light opacity-75">
                  Sistema Administrativo
                </small>
              </div>

            </div>

          </div>

          <div className="panel-right-section">

            <Badge
              bg="light"
              text="dark"
              className="px-3 py-2 rounded-pill"
            >
              <i className="bi bi-box-seam me-2"></i>
              Inventario
            </Badge>

            <div className="action-buttons-group">

              <button
                className="dashboard-btn"
                onClick={() =>
                  router.push(
                    '/admin/dashboard'
                  )
                }
              >
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </button>

              <button
                className="dashboard-btn"
                onClick={() =>
                  router.push(
                    '/admin/branches'
                  )
                }
              >
                <i className="bi bi-shop me-2"></i>
                Sucursales
              </button>

              <button
                className="logout-btn"
                onClick={() => {
                  localStorage.removeItem(
                    'token'
                  );

                  localStorage.removeItem(
                    'user'
                  );

                  router.push('/login');
                }}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Salir
              </button>

            </div>

            <div className="mini-admin-card">

              <div className="mini-admin-icon">
                <i className="bi bi-person-circle"></i>
              </div>

              <div className="mini-admin-info">
                <h6>{user?.name}</h6>
                <p>{user?.email}</p>
              </div>

            </div>

          </div>

        </div>

        <Container
          fluid
          className="main-content-wrapper"
        >

          {/* HERO */}
          <div className="hero-banner">

            <div>

              <h1 className="hero-title">
                Gestión de Inventario
              </h1>

              <p className="hero-subtitle">
                Administra productos,
                imágenes y stock por
                sucursal.
              </p>

            </div>

            <div className="d-flex align-items-center gap-3">

              <Button
                className="upload-btn"
                onClick={() =>
                  document
                    .getElementById(
                      'excelInput'
                    )
                    ?.click()
                }
                disabled={uploading}
              >
                <i className="bi bi-cloud-upload me-2"></i>

                {uploading
                  ? 'Subiendo...'
                  : 'Subir Excel'}
              </Button>

              {/* Icono de Productos - Mismo estilo que branches */}
              <div className="hero-icon-wrapper">
                <i className="bi bi-box-seam"></i>
              </div>

              <Form.Control
                type="file"
                id="excelInput"
                accept=".xlsx,.xls"
                onChange={
                  handleFileUpload
                }
                className="d-none"
              />

            </div>

          </div>

          {/* SUCURSALES */}
          <div className="branches-wrapper">

            {branches.map((branch) => (

              <button
                key={branch.id}
                className={`branch-pill ${
                  selectedBranch ===
                  branch.id
                    ? 'active-branch'
                    : ''
                }`}
                onClick={() =>
                  handleBranchChange(
                    branch.id,
                    branch.name
                  )
                }
              >
                <i className="bi bi-building me-2"></i>
                {branch.name}
              </button>

            ))}

          </div>

          {/* STATS */}
          <Row className="g-4 mb-4">

            <Col md={3}>
              <div className="stats-card">

                <div>
                  <p>Productos</p>
                  <h3>
                    {
                      stats.total_products
                    }
                  </h3>
                </div>

                <i className="bi bi-box-seam text-primary"></i>

              </div>
            </Col>

            <Col md={3}>
              <div className="stats-card">

                <div>
                  <p>Unidades</p>
                  <h3>
                    {
                      stats.total_units
                    }
                  </h3>
                </div>

                <i className="bi bi-cubes text-success"></i>

              </div>
            </Col>

            <Col md={3}>
              <div className="stats-card">

                <div>
                  <p>
                    Valor Inventario
                  </p>

                  <h3 className="text-primary">
                    $
                    {stats.total_value?.toLocaleString()}
                  </h3>
                </div>

                <i className="bi bi-currency-dollar text-info"></i>

              </div>
            </Col>

            <Col md={3}>
              <div className="stats-card">

                <div>
                  <p>Stock Bajo</p>

                  <h3 className="text-warning">
                    {
                      stats.low_stock_count
                    }
                  </h3>
                </div>

                <i className="bi bi-exclamation-triangle text-warning"></i>

              </div>
            </Col>

          </Row>

          {/* FILTERS */}
          <Card className="glass-card border-0 mb-4">

            <Card.Body>

              <Row className="g-3">

                <Col md={5}>
                  <InputGroup>

                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>

                    <Form.Control
                      placeholder="Buscar producto..."
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                    />

                  </InputGroup>
                </Col>

                <Col md={4}>
                  <Form.Select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value
                      )
                    }
                  >
                    {categories.map(
                      (cat) => (
                        <option
                          key={cat}
                          value={cat}
                        >
                          {cat === 'all'
                            ? 'Todas las categorías'
                            : cat}
                        </option>
                      )
                    )}
                  </Form.Select>
                </Col>

                <Col md={3}>
                  <div className="d-flex gap-2">

                    <Button
                      className="flex-grow-1"
                      variant={
                        viewMode ===
                        'table'
                          ? 'primary'
                          : 'outline-secondary'
                      }
                      onClick={() =>
                        setViewMode(
                          'table'
                        )
                      }
                    >
                      Tabla
                    </Button>

                    <Button
                      className="flex-grow-1"
                      variant={
                        viewMode ===
                        'cards'
                          ? 'primary'
                          : 'outline-secondary'
                      }
                      onClick={() =>
                        setViewMode(
                          'cards'
                        )
                      }
                    >
                      Tarjetas
                    </Button>

                  </div>
                </Col>

              </Row>

            </Card.Body>

          </Card>

          {/* TABLE */}
          {viewMode === 'table' && (

            <Card className="glass-card border-0 overflow-hidden">

              <div className="table-responsive">

                <Table className="modern-table mb-0 align-middle">

                  <thead>

                    <tr>
                      <th>Imagen</th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Costo</th>
                      <th>Precio</th>
                      <th>Ganancia</th>
                      <th>Stock</th>
                      <th>Ubicación</th>
                      <th>Acciones</th>
                    </tr>

                  </thead>

                  <tbody>

                    {filteredProducts.map(
                      (product) => (

                        <tr
                          key={product.id}
                        >

                          <td>

                            {product.image_url ? (

                              <img
                                src={
                                  product.image_url
                                }
                                alt={
                                  product.name
                                }
                                className="table-product-image"
                              />

                            ) : (

                              <span className="fs-2">
                                {getProductIcon(
                                  product.category
                                )}
                              </span>

                            )}

                          </td>

                          <td>

                            <div className="fw-semibold text-dark">
                              {
                                product.name
                              }
                            </div>

                            <small className="text-muted">
                              {product.barcode ||
                                'Sin código'}
                            </small>

                          </td>

                          <td>

                            <Badge bg="secondary">
                              {
                                product.category
                              }
                            </Badge>

                          </td>

                          <td className="fw-semibold">
                            $
                            {
                              product.purchase_price
                            }
                          </td>

                          <td className="text-primary fw-bold">
                            $
                            {
                              product.selling_price
                            }
                          </td>

                          <td className="text-success fw-bold">
                            $
                            {(
                              product.selling_price -
                              product.purchase_price
                            ).toFixed(2)}
                          </td>

                          <td>
                            {getStockBadge(
                              product.stock,
                              product.min_stock
                            )}
                          </td>

                          <td>
                            {product.location ||
                              '-'}
                          </td>

                          <td>

                            <div className="d-flex gap-2">

                              <button
                                className="action-btn primary-btn"
                                onClick={() =>
                                  openImageModal(
                                    product
                                  )
                                }
                              >
                                <i className="bi bi-image"></i>
                              </button>

                              <button
                                className="action-btn success-btn"
                                onClick={() =>
                                  updateStock(
                                    product.id,
                                    product.stock +
                                      1
                                  )
                                }
                              >
                                <i className="bi bi-plus"></i>
                              </button>

                              <button
                                className="action-btn warning-btn"
                                onClick={() =>
                                  updateStock(
                                    product.id,
                                    product.stock -
                                      1
                                  )
                                }
                                disabled={
                                  product.stock <=
                                  0
                                }
                              >
                                <i className="bi bi-dash"></i>
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </Table>

              </div>

            </Card>

          )}

          {/* CARDS */}
          {viewMode === 'cards' && (

            <Row className="g-4">

              {filteredProducts.map(
                (product) => (

                  <Col
                    key={product.id}
                    xs={12}
                    sm={6}
                    lg={4}
                    xl={3}
                  >

                    <Card className="product-card border-0 h-100">

                      <div className="product-image-wrapper">

                        {product.image_url ? (

                          <img
                            src={
                              product.image_url
                            }
                            alt={
                              product.name
                            }
                            className="product-image"
                          />

                        ) : (

                          <div className="product-icon">
                            {getProductIcon(
                              product.category
                            )}
                          </div>

                        )}

                      </div>

                      <Card.Body>

                        <div className="d-flex justify-content-between align-items-start mb-2">

                          <div>

                            <h5 className="product-title">
                              {
                                product.name
                              }
                            </h5>

                            <p className="product-category">
                              {
                                product.category
                              }
                            </p>

                          </div>

                          {getStockBadge(
                            product.stock,
                            product.min_stock
                          )}

                        </div>

                        <p className="product-description">
                          {product.description ||
                            'Sin descripción'}
                        </p>

                        <div className="price-section">

                          <div>
                            <small className="text-muted">
                              Costo
                            </small>

                            <h6 className="text-dark fw-bold">
                              $
                              {
                                product.purchase_price
                              }
                            </h6>
                          </div>

                          <div className="text-end">
                            <small className="text-muted">
                              Venta
                            </small>

                            <h5 className="text-primary fw-bold">
                              $
                              {
                                product.selling_price
                              }
                            </h5>
                          </div>

                        </div>

                        <div className="profit-box">

                          Ganancia:
                          <span>
                            $
                            {(
                              product.selling_price -
                              product.purchase_price
                            ).toFixed(2)}
                          </span>

                        </div>

                        <div className="product-actions">

                          <button
                            className="action-btn primary-btn"
                            onClick={() =>
                              openImageModal(
                                product
                              )
                            }
                          >
                            <i className="bi bi-image"></i>
                          </button>

                          <button
                            className="action-btn success-btn"
                            onClick={() =>
                              updateStock(
                                product.id,
                                product.stock +
                                  1
                              )
                            }
                          >
                            <i className="bi bi-plus"></i>
                          </button>

                          <button
                            className="action-btn warning-btn"
                            onClick={() =>
                              updateStock(
                                product.id,
                                product.stock -
                                  1
                              )
                            }
                            disabled={
                              product.stock <=
                              0
                            }
                          >
                            <i className="bi bi-dash"></i>
                          </button>

                        </div>

                      </Card.Body>

                    </Card>

                  </Col>

                )
              )}

            </Row>

          )}

        </Container>

      </div>

      {/* MODAL IMAGEN */}
      <Modal
        show={showImageModal}
        onHide={() => {
          setShowImageModal(false);
          setSelectedFile(null);
          setImagePreview('');
        }}
        centered
        size="lg"
      >

        <Modal.Header closeButton>

          <Modal.Title>
            Imagen del producto
          </Modal.Title>

        </Modal.Header>

        <Modal.Body>

          <Form>

            {selectedProduct
              ?.image_url &&
              !selectedFile && (

                <div className="text-center mb-4">

                  <img
                    src={
                      selectedProduct.image_url
                    }
                    alt={
                      selectedProduct.name
                    }
                    className="preview-image"
                  />

                  <div className="mt-3">

                    <Button
                      variant="outline-danger"
                      onClick={() => {
                        handleDeleteImage(
                          selectedProduct
                        );

                        setShowImageModal(
                          false
                        );
                      }}
                    >
                      Eliminar imagen
                    </Button>

                  </div>

                </div>

              )}

            <div className="upload-box">

              {imagePreview ? (

                <div className="text-center">

                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="preview-image"
                  />

                </div>

              ) : (

                <>

                  <i className="bi bi-cloud-upload upload-icon"></i>

                  <p className="text-muted">
                    Selecciona una imagen
                  </p>

                  <Button
                    variant="outline-primary"
                    onClick={() =>
                      document
                        .getElementById(
                          'imageInput'
                        )
                        ?.click()
                    }
                  >
                    Seleccionar
                  </Button>

                  <Form.Control
                    type="file"
                    id="imageInput"
                    accept="image/*"
                    onChange={
                      handleFileSelect
                    }
                    className="d-none"
                  />

                </>

              )}

            </div>

            <hr />

            <InputGroup>

              <Form.Control
                placeholder="URL de imagen"
                value={imageUrl}
                onChange={(e) =>
                  setImageUrl(
                    e.target.value
                  )
                }
              />

              <Button
                variant="primary"
                onClick={
                  handleUpdateImageUrl
                }
              >
                Usar URL
              </Button>

            </InputGroup>

          </Form>

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setShowImageModal(false)
            }
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            onClick={
              handleUploadImage
            }
            disabled={
              !selectedFile ||
              uploadingImage
            }
          >
            {uploadingImage
              ? 'Subiendo...'
              : 'Subir imagen'}
          </Button>

        </Modal.Footer>

      </Modal>

      {/* MODAL ALERT */}
      <Modal
        show={showModal}
        onHide={() =>
          setShowModal(false)
        }
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>
            {modalVariant ===
            'success'
              ? 'Éxito'
              : 'Error'}
          </Modal.Title>

        </Modal.Header>

        <Modal.Body>

          <Alert
            variant={modalVariant}
            className="mb-0"
          >
            {modalMessage}
          </Alert>

        </Modal.Body>

      </Modal>

      <style jsx>{`

        .loading-screen {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(
            135deg,
            #0f172a,
            #1e3a8a
          );
        }

        .hero-section {
          min-height: 100vh;
          background: linear-gradient(
            135deg,
            #0f172a,
            #1e3a8a,
            #2563eb
          );
          padding-bottom: 4rem;
        }

        .panel-top-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem 2rem;
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .panel-logo-box {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .panel-logo-wrapper {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: rgba(255,255,255,0.08);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .panel-right-section {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .action-buttons-group {
          display: flex;
          gap: 12px;
        }

        .dashboard-btn,
        .logout-btn {
          border: none;
          padding: 12px 22px;
          border-radius: 16px;
          background: rgba(255,255,255,0.12);
          color: white;
          font-weight: 600;
          transition: 0.3s;
        }

        .dashboard-btn:hover {
          background: #2563eb;
        }

        .logout-btn:hover {
          background: #dc2626;
        }

        .mini-admin-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 14px;
          border-radius: 50px;
          background: rgba(255,255,255,0.1);
        }

        .mini-admin-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #3b82f6,
            #2563eb
          );
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
        }

        .mini-admin-info h6 {
          color: white;
          margin: 0;
        }

        .mini-admin-info p {
          margin: 0;
          font-size: 12px;
          color: rgba(255,255,255,0.7);
        }

        .main-content-wrapper {
          padding-top: 2rem;
        }

        .hero-banner {
          background: rgba(255,255,255,0.08);
          border-radius: 30px;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          backdrop-filter: blur(12px);
        }

        .hero-title {
          color: white;
          font-size: 3rem;
          font-weight: 800;
        }

        .hero-subtitle {
          color: rgba(255,255,255,0.75);
        }

        .hero-icon-wrapper {
       width: 110px;
          height: 110px;
          border-radius: 30px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 3rem;
        }

        .upload-btn {
          border: none !important;
          background: white !important;
          color: #1e3a8a !important;
          border-radius: 18px;
          padding: 14px 24px;
          font-weight: 700;
        }

        .branches-wrapper {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .branch-pill {
          border: none;
          padding: 12px 20px;
          border-radius: 50px;
          background: rgba(255,255,255,0.12);
          color: white;
          transition: 0.3s;
        }

        .active-branch {
          background: white !important;
          color: #1e3a8a !important;
          font-weight: 700;
        }

        .stats-card {
          background: white;
          border-radius: 24px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          transition: 0.3s;
        }

        .stats-card:hover {
          transform: translateY(-5px);
        }

        .stats-card p {
          margin: 0;
          color: #64748b;
        }

        .stats-card i {
          font-size: 2rem;
        }

        .glass-card {
          background: white !important;
          border-radius: 24px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .modern-table th {
          background: #f8fafc !important;
          color: #334155;
          font-weight: 700;
          border: none;
          padding: 1rem;
        }

        .modern-table td {
          padding: 1rem;
          vertical-align: middle;
        }

        .table-product-image {
          width: 45px;
          height: 45px;
          object-fit: contain;
        }

        .product-card {
          background: white;
          border-radius: 28px;
          overflow: hidden;
          transition: 0.3s;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .product-card:hover {
          transform: translateY(-8px);
        }

        .product-image-wrapper {
          height: 220px;
          background: #f8fafc;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .product-image {
          width: 140px;
          height: 140px;
          object-fit: contain;
        }

        .product-icon {
          font-size: 5rem;
        }

        .product-title {
          color: #0f172a;
          font-weight: 700;
        }

        .product-category {
          color: #64748b;
          font-size: 14px;
        }

        .product-description {
          color: #475569;
          font-size: 14px;
          min-height: 42px;
        }

        .price-section {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
        }

        .profit-box {
          margin-top: 1rem;
          background: #ecfdf5;
          color: #059669;
          padding: 10px 14px;
          border-radius: 14px;
          font-weight: 700;
          display: flex;
          justify-content: space-between;
        }

        .product-actions {
          display: flex;
          gap: 10px;
          margin-top: 1.5rem;
        }

        .action-btn {
          flex: 1;
          height: 42px;
          border-radius: 14px;
          border: none;
          color: white;
          transition: 0.3s;
        }

        .primary-btn {
          background: #2563eb;
        }

        .success-btn {
          background: #10b981;
        }

        .warning-btn {
          background: #f59e0b;
        }

        .preview-image {
          max-width: 220px;
          max-height: 220px;
          object-fit: contain;
        }

        .upload-box {
          border: 2px dashed #cbd5e1;
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
        }

        .upload-icon {
          font-size: 3rem;
          color: #94a3b8;
        }

        @media (max-width: 992px) {

          .panel-top-section {
            flex-direction: column;
            gap: 20px;
          }

          .panel-right-section {
            flex-wrap: wrap;
            justify-content: center;
          }

          .hero-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

        }

        @media (max-width: 768px) {

          .action-buttons-group {
            flex-direction: column;
            width: 100%;
          }

          .dashboard-btn,
          .logout-btn {
            width: 100%;
          }

          .mini-admin-card {
            width: 100%;
            justify-content: center;
          }

          .hero-title {
            font-size: 2rem;
          }

        }

      `}</style>
    </>
  );
}