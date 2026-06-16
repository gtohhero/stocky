'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Card, Form, Button, Navbar, Nav, Badge, InputGroup } from 'react-bootstrap';

interface Product {
  id: number;
  name: string;
  description: string;
  selling_price: number;
  stock: number;
  category: string;
  image_url: string;
  location?: string;
}

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
}

export default function PublicShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingBranch, setLoadingBranch] = useState(true);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchProductsByBranch();
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/branches');
      const data = await res.json();
      const branchesList = Array.isArray(data) ? data : [];
      setBranches(branchesList);
      if (branchesList.length > 0) {
        setSelectedBranch(branchesList[0].id);
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      setBranches([]);
    } finally {
      setLoadingBranch(false);
    }
  };

  const fetchProductsByBranch = async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/products/branch/${selectedBranch}`);
      const data = await res.json();
      const productsList = data.products || [];
      setProducts(productsList);
      
      if (productsList.length > 0) {
        const uniqueCategories = ['all', ...new Set<string>(productsList.map((p: Product) => p.category))];
        setCategories(uniqueCategories);
      } else {
        setCategories(['all']);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge bg="danger">Agotado</Badge>;
    if (stock < 10) return <Badge bg="warning" text="dark">Stock bajo ({stock})</Badge>;
    return <Badge bg="success">En stock ({stock})</Badge>;
  };

  // Función para obtener el icono de Bootstrap según la categoría
  const getProductIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Medicamentos': 'bi-capsule',
      'Vitaminas': 'bi-flower1',
      'Insumos': 'bi-band-aid',
      'Limpieza': 'bi-droplet',
      'Cuidado': 'bi-heart',
      'Equipos': 'bi-thermometer',
      'Protección': 'bi-shield-shaded',
      'General': 'bi-box-seam'
    };
    return icons[category] || 'bi-box-seam';
  };

  const handleImageError = (productId: number) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch && product.stock > 0;
  });

  const selectedBranchData = branches.find(b => b.id === selectedBranch);

  if (loadingBranch) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navbar Responsive */}
      <Navbar bg="white" expand="lg" sticky="top" className="shadow-sm">
        <Container>
          <Navbar.Brand href="/" className="d-flex align-items-center gap-2">
            <Image 
              src="/images/logo.png" 
              alt="Stocky Logo" 
              width={35} 
              height={35}
              style={{ objectFit: 'contain' }}
              className="mobile-logo"
            />
            <span className="fw-bold text-primary d-none d-sm-inline">Stocky Farmacia</span>
            <span className="fw-bold text-primary d-inline d-sm-none">Stocky</span>
          </Navbar.Brand>
        </Container>
      </Navbar>

      {/* Hero Section Responsive */}
      <div className="bg-primary text-white py-4 py-md-5">
        <Container className="text-center py-3 py-md-5">
          <h1 className="display-5 display-md-4 fw-bold mb-2 mb-md-3">Bienvenido a Stocky Farmacia</h1>
          <p className="lead fs-6 fs-md-5 mb-3 mb-md-4 px-2">Tu salud es nuestra prioridad. Encuentra los mejores productos al mejor precio.</p>
          
          {/* Selector de Sucursal Responsive */}
          <Row className="justify-content-center mb-3">
            <Col xs={10} sm={8} md={6} lg={4}>
              <div className="bg-white rounded-3 p-2">
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <i className="bi bi-geo-alt text-primary"></i>
                  </InputGroup.Text>
                  <Form.Select 
                    value={selectedBranch || ''} 
                    onChange={(e) => setSelectedBranch(parseInt(e.target.value))}
                    className="border-start-0 ps-0 fw-semibold"
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </div>
            </Col>
          </Row>

          {selectedBranchData && (
            <div className="mb-3">
              <p className="mb-0 small opacity-75">
                <i className="bi bi-telephone me-1"></i> {selectedBranchData.phone || 'No disponible'} 
                <i className="bi bi-geo-alt ms-2 ms-md-3 me-1"></i> 
                <span className="d-none d-sm-inline">{selectedBranchData.address || 'Dirección no disponible'}</span>
                <span className="d-inline d-sm-none">{selectedBranchData.address?.substring(0, 30) || 'Dirección no disponible'}</span>
              </p>
            </div>
          )}

          <Row className="justify-content-center">
            <Col xs={11} sm={10} md={8} lg={6}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="lg"
                  className="py-2 py-md-3"
                />
                <Button variant="light" size="lg" className="px-3 px-md-4">
                  <i className="bi bi-search"></i> <span className="d-none d-sm-inline">Buscar</span>
                </Button>
              </InputGroup>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Filtros Responsive */}
      <Container className="py-3 py-md-4">
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'primary' : 'outline-secondary'}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
              className="rounded-pill px-3 py-1 px-md-4 py-md-2"
            >
              {cat === 'all' ? 'Todos' : cat}
            </Button>
          ))}
        </div>
      </Container>

      {/* Grid de Productos Responsive */}
      <Container className="py-3 py-md-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando productos...</span>
            </div>
            <p className="text-muted mt-2">Cargando productos de {selectedBranchData?.name}...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-box-seam fs-1 text-muted"></i>
            <p className="text-muted fs-5 mt-3">No se encontraron productos en esta sucursal</p>
            <p className="text-muted small">Prueba con otra sucursal o más tarde</p>
          </div>
        ) : (
          <>
            <div className="text-end mb-3">
              <small className="text-muted">
                <i className="bi bi-box me-1"></i> {filteredProducts.length} productos encontrados
              </small>
            </div>
            <Row xs={1} sm={2} md={3} lg={4} className="g-3 g-md-4">
              {filteredProducts.map((product) => (
                <Col key={product.id}>
                  <Card className="h-100 shadow-sm border-0 hover-shadow transition">
                    <div className="position-relative">
                      <div className="text-center py-3 bg-light rounded-top" style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product.image_url && !imageErrors[product.id] ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            style={{ width: '120px', height: '120px', objectFit: 'contain' }}
                            className="product-card-image"
                            onError={() => handleImageError(product.id)}
                          />
                        ) : (
                          <div className="d-flex flex-column align-items-center">
                            <i className={`${getProductIcon(product.category)} fs-1 text-secondary`}></i>
                            <small className="text-muted mt-1">Sin imagen</small>
                          </div>
                        )}
                      </div>
                      
                      <div className="position-absolute top-0 end-0 m-2">
                        {product.stock === 0 ? (
                          <Badge bg="danger" className="rounded-pill">Agotado</Badge>
                        ) : product.stock < 10 ? (
                          <Badge bg="warning" text="dark" className="rounded-pill">Últimas {product.stock}</Badge>
                        ) : null}
                      </div>
                    </div>
                    
                    <Card.Body className="p-3 p-md-4">
                      <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-1">
                        <Card.Subtitle className="text-muted small">{product.category}</Card.Subtitle>
                        {getStockBadge(product.stock)}
                      </div>
                      <Card.Title className="fs-6 fs-md-5 mb-2">{product.name}</Card.Title>
                      <Card.Text className="text-muted small">
                        {product.description ? product.description.substring(0, 60) : 'Sin descripción'}
                        {product.description && product.description.length > 60 ? '...' : ''}
                      </Card.Text>
                      {product.location && (
                        <div className="text-muted small mb-2">
                          <i className="bi bi-pin-map me-1"></i> {product.location}
                        </div>
                      )}
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          <span className="fs-5 fw-bold text-primary">${product.selling_price}</span>
                          <span className="text-muted small"> MXN</span>
                        </div>
                        <Link href={`/product/${product.id}?branch=${selectedBranch}`}>
                          <Button variant="outline-primary" size="sm" className="px-2 px-md-3">
                            Ver detalles
                          </Button>
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Container>

      {/* Footer Responsive */}
      <footer className="bg-dark text-white py-3 py-md-4 mt-4 mt-md-5">
        <Container className="text-center">
          <p className="mb-0 small">&copy; 2024 Stocky Farmacia. Todos los derechos reservados.</p>
          <p className="text-muted small mt-1">Tu salud, nuestra prioridad</p>
        </Container>
      </footer>

      <style jsx>{`
        .transition {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .product-card-image {
          transition: transform 0.3s ease;
        }
        .product-card-image:hover {
          transform: scale(1.05);
        }
        @media (max-width: 576px) {
          .mobile-logo {
            width: 30px;
            height: 30px;
          }
        }
      `}</style>
    </>
  );
}