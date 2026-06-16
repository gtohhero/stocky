'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Card, Button, Navbar, Nav, Spinner, Badge } from 'react-bootstrap';

interface Product {
  id: number;
  name: string;
  description: string;
  usage_description: string;
  benefits: string;
  side_effects: string;
  presentation: string;
  laboratory: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  category: string;
  branch: string;
  branch_id: number;
  location: string;
  barcode: string;
  image_url: string;
  min_stock: number;
}

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
}

interface BranchStock {
  branch_id: number;
  branch_name: string;
  stock: number;
  location: string;
  selling_price: number;
}

export default function ProductDetail() {
  const [product, setProduct] = useState<Product | null>(null);
  const [branches, setBranches] = useState<BranchStock[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState('');
  
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const branchIdParam = searchParams.get('branch');

  useEffect(() => {
    fetchProduct();
    fetchBranchesInfo();
  }, [params.id, branchIdParam]);

  const fetchProduct = async () => {
    try {
      const url = branchIdParam 
        ? `http://localhost:5001/api/products/${params.id}?branch=${branchIdParam}`
        : `http://localhost:5001/api/products/${params.id}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Producto no encontrado');
      }
      
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudo cargar la información del producto');
    }
  };

  const fetchBranchesInfo = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/products/${params.id}/branches`);
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      }
      
      if (branchIdParam) {
        const branchRes = await fetch(`http://localhost:5001/api/branches/${branchIdParam}`);
        if (branchRes.ok) {
          const branchData = await branchRes.json();
          setCurrentBranch(branchData);
        }
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Agotado', color: 'danger', icon: 'bi-x-circle' };
    if (stock < 10) return { text: 'Stock bajo', color: 'warning', icon: 'bi-exclamation-triangle' };
    return { text: 'En stock', color: 'success', icon: 'bi-check-circle' };
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

  const handleBranchChange = (branchId: number) => {
    router.push(`/product/${params.id}?branch=${branchId}`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <>
        <Navbar bg="white" expand="lg" className="shadow-sm px-3 px-md-4 py-2 py-md-3">
          <Container>
            <Navbar.Brand href="/" className="d-flex align-items-center gap-2">
              <Image src="/images/logo.png" alt="Logo" width={30} height={30} style={{ objectFit: 'contain' }} />
              <span className="fw-bold text-primary">Stocky Farmacia</span>
            </Navbar.Brand>
          </Container>
        </Navbar>
        <Container className="py-5 text-center">
          <i className="bi bi-exclamation-triangle fs-1 text-danger"></i>
          <h3 className="mt-3">{error || 'Producto no encontrado'}</h3>
          <Link href="/" className="btn btn-primary mt-3">
            <i className="bi bi-arrow-left me-1"></i>Volver a la tienda
          </Link>
        </Container>
      </>
    );
  }

  const stockStatus = getStockStatus(product.stock);

  return (
    <>
      <Navbar bg="white" expand="lg" className="shadow-sm px-3 px-md-4 py-2 py-md-3">
        <Container>
          <Navbar.Brand href="/" className="d-flex align-items-center gap-2">
            <Image src="/images/logo.png" alt="Stocky Logo" width={30} height={30} style={{ objectFit: 'contain' }} />
            <span className="fw-bold text-primary d-none d-sm-inline">Stocky Farmacia</span>
            <span className="fw-bold text-primary d-inline d-sm-none">Stocky</span>
          </Navbar.Brand>
        </Container>
      </Navbar>

      <Container className="py-3 py-md-4 px-3 px-md-4">
        {/* Botón volver mejorado */}
        <Button 
          variant="outline-secondary" 
          onClick={() => router.back()}
          className="mb-4 rounded-pill px-4 py-2 shadow-sm hover-scale"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Volver a la tienda
        </Button>

        {/* Selector de sucursal responsivo */}
        {branches.length > 0 && (
          <Card className="border-0 shadow-sm rounded-4 mb-3 mb-md-4 bg-light">
            <Card.Body className="p-2 p-md-3">
              <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 gap-md-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-shop text-primary"></i>
                  <span className="fw-semibold small">Disponibilidad:</span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {branches.map((branch) => {
                    const isActive = branchIdParam && parseInt(branchIdParam) === branch.branch_id;
                    const status = getStockStatus(branch.stock);
                    return (
                      <Button
                        key={branch.branch_id}
                        variant={isActive ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => handleBranchChange(branch.branch_id)}
                        className="rounded-pill px-2 px-md-3 py-1"
                      >
                        <i className="bi bi-building me-1"></i>
                        <span className="d-none d-sm-inline">{branch.branch_name}</span>
                        <span className="d-inline d-sm-none">{branch.branch_name.substring(0, 10)}</span>
                        <Badge 
                          bg={isActive ? 'light' : status.color} 
                          text={isActive ? 'dark' : 'white'}
                          className="ms-1 ms-md-2"
                        >
                          {branch.stock}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Producto Principal Responsive */}
        <Row className="g-3 g-md-4">
          {/* Imagen del producto - Responsive */}
          <Col xs={12} md={5} lg={5}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="bg-gradient-light p-3 p-md-4 text-center position-relative">
                {product.image_url ? (
                  <div className="product-image-container">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="product-image"
                      style={{ 
                        objectFit: 'contain',
                        width: '100%',
                        height: 'auto',
                        maxHeight: '300px'
                      }}
                      priority
                    />
                  </div>
                ) : (
                  <div className="py-4 py-md-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '250px' }}>
                    <div className="bg-white rounded-circle p-3 p-md-4 shadow-sm mb-2 mb-md-3">
                      <i className={`${getProductIcon(product.category)} fs-1 text-primary`}></i>
                    </div>
                    <p className="text-muted small mb-0">Imagen no disponible</p>
                  </div>
                )}
                
                <div className="position-absolute top-0 end-0 m-2 m-md-3">
                  <Badge 
                    bg={stockStatus.color} 
                    className="px-2 px-md-3 py-1 py-md-2 rounded-pill shadow-sm"
                  >
                    <i className={`bi ${stockStatus.icon} me-1`}></i>
                    <span className="d-none d-sm-inline">{stockStatus.text}</span>
                  </Badge>
                </div>
              </div>
              
              <div className="bg-white p-2 p-md-3 border-top">
                <div className="d-flex justify-content-center gap-2 gap-md-3 flex-wrap">
                  <div className="text-center">
                    <i className="bi bi-check-circle-fill text-success fs-6 fs-md-5"></i>
                    <small className="text-muted d-block fs-7">Original</small>
                  </div>
                  <div className="text-center">
                    <i className="bi bi-truck text-primary fs-6 fs-md-5"></i>
                    <small className="text-muted d-block fs-7">Envío</small>
                  </div>
                  <div className="text-center">
                    <i className="bi bi-shield-check text-info fs-6 fs-md-5"></i>
                    <small className="text-muted d-block fs-7">Garantía</small>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Información principal - Responsive */}
          <Col xs={12} md={7} lg={7}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-3 p-md-4">
                <div className="mb-2 d-flex flex-wrap gap-2">
                  <Badge bg="secondary" className="rounded-pill">{product.category}</Badge>
                  <Badge bg={stockStatus.color} className="rounded-pill">
                    <i className={`bi ${stockStatus.icon} me-1`}></i>
                    {stockStatus.text} ({product.stock} und)
                  </Badge>
                </div>
                
                <h1 className="h2 h-md-1 fw-bold mb-2 mb-md-3">{product.name}</h1>
                
                {product.barcode && (
                  <p className="text-muted small mb-2 mb-md-3">
                    <i className="bi bi-upc-scan me-1"></i> {product.barcode}
                  </p>
                )}
                
                <div className="mb-3 mb-md-4">
                  <span className="h2 h-md-1 fw-bold text-primary">${product.selling_price}</span>
                  <span className="text-muted ms-2">MXN</span>
                </div>

                <p className="text-muted mb-3 mb-md-4 small">
                  {product.description || 'Sin descripción disponible'}
                </p>

                {currentBranch && (
                  <div className="bg-light rounded-3 p-2 p-md-3 mb-3 mb-md-4">
                    <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 gap-md-3">
                      <div>
                        <i className="bi bi-building text-primary"></i>
                        <strong className="ms-1">Sucursal:</strong> {currentBranch.name}
                      </div>
                      {currentBranch.address && (
                        <div>
                          <i className="bi bi-geo-alt text-primary"></i>
                          <span className="ms-1">{currentBranch.address}</span>
                        </div>
                      )}
                      {currentBranch.phone && (
                        <div>
                          <i className="bi bi-telephone text-primary"></i>
                          <span className="ms-1">{currentBranch.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {product.location && (
                  <div className="mb-3 mb-md-4">
                    <i className="bi bi-pin-map text-primary me-2"></i>
                    <strong>Ubicación:</strong> {product.location}
                  </div>
                )}

                <Button 
                  variant="primary" 
                  onClick={() => setShowInfo(!showInfo)}
                  className="w-100 py-2 py-md-3 rounded-pill"
                >
                  <i className={`bi ${showInfo ? 'bi-chevron-up' : 'bi-chevron-down'} me-2`}></i>
                  {showInfo ? 'Ocultar información' : 'Ver información completa'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Información adicional expandible - Responsive */}
        {showInfo && (
          <Row className="mt-3 mt-md-4">
            <Col xs={12}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-3 p-md-4">
                  <h4 className="mb-3 mb-md-4 fw-bold fs-5 fs-md-4">
                    <i className="bi bi-info-circle-fill text-primary me-2"></i>
                    Información del producto
                  </h4>
                  
                  <Row className="g-3 g-md-4">
                    <Col xs={12} md={6}>
                      <div className="border-start border-3 border-primary ps-3">
                        <h6 className="mb-2 fw-semibold">
                          <i className="bi bi-question-circle text-primary me-2"></i>
                          ¿Para qué sirve?
                        </h6>
                        <p className="text-muted small mb-0">{product.usage_description || 'No especificado'}</p>
                      </div>
                    </Col>
                    
                    <Col xs={12} md={6}>
                      <div className="border-start border-3 border-success ps-3">
                        <h6 className="mb-2 fw-semibold">
                          <i className="bi bi-star text-success me-2"></i>
                          Beneficios
                        </h6>
                        <p className="text-muted small mb-0">{product.benefits || 'No especificado'}</p>
                      </div>
                    </Col>
                    
                    <Col xs={12} md={6}>
                      <div className="border-start border-3 border-warning ps-3">
                        <h6 className="mb-2 fw-semibold">
                          <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                          Efectos secundarios
                        </h6>
                        <p className="text-muted small mb-0">{product.side_effects || 'No especificado'}</p>
                      </div>
                    </Col>
                    
                    <Col xs={12} md={6}>
                      <div className="border-start border-3 border-info ps-3">
                        <h6 className="mb-2 fw-semibold">
                          <i className="bi bi-box text-info me-2"></i>
                          Presentación
                        </h6>
                        <p className="text-muted small mb-0">{product.presentation || 'No especificado'}</p>
                      </div>
                    </Col>
                    
                    <Col xs={12} md={6}>
                      <div className="border-start border-3 border-secondary ps-3">
                        <h6 className="mb-2 fw-semibold">
                          <i className="bi bi-building text-secondary me-2"></i>
                          Laboratorio
                        </h6>
                        <p className="text-muted small mb-0">{product.laboratory || 'No especificado'}</p>
                      </div>
                    </Col>
                    
                    <Col xs={12} md={6}>
                      <div className="border-start border-3 border-danger ps-3">
                        <h6 className="mb-2 fw-semibold">
                          <i className="bi bi-bell text-danger me-2"></i>
                          Stock mínimo
                        </h6>
                        <p className="text-muted small mb-0">{product.min_stock || 5} unidades</p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Disponibilidad en otras sucursales - Responsive */}
        {branches.length > 1 && (
          <Row className="mt-3 mt-md-4">
            <Col xs={12}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Header className="bg-white border-0 pt-3 pt-md-4 px-3 px-md-4">
                  <h6 className="mb-0 fw-semibold">
                    <i className="bi bi-shop me-2 text-primary"></i>
                    Otras sucursales
                  </h6>
                </Card.Header>
                <Card.Body className="p-3 p-md-4">
                  <Row className="g-2 g-md-3">
                    {branches
                      .filter(b => !(branchIdParam && parseInt(branchIdParam) === b.branch_id))
                      .map((branch) => {
                        const status = getStockStatus(branch.stock);
                        return (
                          <Col key={branch.branch_id} xs={12} sm={6} md={4}>
                            <div className="border rounded-3 p-2 p-md-3 h-100">
                              <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-1">
                                <h6 className="mb-0 fw-semibold fs-6">
                                  <i className="bi bi-building me-1"></i>
                                  {branch.branch_name}
                                </h6>
                                <Badge bg={status.color}>{branch.stock} uds</Badge>
                              </div>
                              <p className="text-muted small mb-2">
                                <i className="bi bi-pin-map me-1"></i>
                                {branch.location || 'Ubicación no especificada'}
                              </p>
                              <p className="text-success small mb-2">
                                <i className="bi bi-currency-dollar me-1"></i>
                                ${branch.selling_price}
                              </p>
                              {branch.stock > 0 ? (
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  className="mt-2 w-100 py-1 rounded-pill"
                                  onClick={() => handleBranchChange(branch.branch_id)}
                                >
                                  Ver en esta sucursal
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm" 
                                  className="mt-2 w-100 py-1 rounded-pill"
                                  disabled
                                >
                                  No disponible
                                </Button>
                              )}
                            </div>
                          </Col>
                        );
                      })}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      <footer className="bg-dark text-white py-3 py-md-4 mt-4 mt-md-5">
        <Container className="text-center">
          <p className="mb-0 small">&copy; 2024 Stocky Farmacia. Todos los derechos reservados.</p>
          <p className="text-muted small mt-1">Tu salud, nuestra prioridad</p>
        </Container>
      </footer>

      <style jsx>{`
        .bg-gradient-light {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        .sticky-top {
          position: sticky;
          top: 20px;
          z-index: 10;
        }
        .product-image-container {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 16px;
          padding: 15px;
          transition: transform 0.3s ease;
        }
        .product-image-container:hover {
          transform: scale(1.02);
        }
        .product-image {
          transition: all 0.3s ease;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }
        .product-image:hover {
          filter: drop-shadow(0 8px 15px rgba(0, 0, 0, 0.15));
        }
        .fs-7 {
          font-size: 0.7rem;
        }
        .hover-scale {
          transition: transform 0.2s ease;
        }
        .hover-scale:hover {
          transform: scale(1.02);
        }
        @media (max-width: 768px) {
          .sticky-top {
            position: relative;
            top: 0;
          }
          .product-image-container {
            padding: 10px;
          }
        }
      `}</style>
    </>
  );
}