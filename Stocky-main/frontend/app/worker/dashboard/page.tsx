'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Container, Row, Col, Card, Button, Navbar, Nav, Spinner, Badge, Dropdown, DropdownButton } from 'react-bootstrap';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  selling_price: number;
  stock: number;
  category: string;
  image_url: string;
}

export default function WorkerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData!);
    if (parsedUser.role !== 'WORKER' && parsedUser.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    
    setUser(parsedUser);
    fetchWorkerBranches(parsedUser.id);
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchProductsByBranch();
    }
  }, [selectedBranch]);

  const fetchWorkerBranches = async (userId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5001/api/users/${userId}/branches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const branchesList = Array.isArray(data) ? data : [];
      setBranches(branchesList);
      
      if (branchesList.length > 0) {
        setSelectedBranch(branchesList[0].id);
        setSelectedBranchName(branchesList[0].name);
      }
    } catch (error) {
      console.error('Error:', error);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByBranch = async () => {
    if (!selectedBranch) return;
    setLoadingProducts(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/products/branch/${selectedBranch}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge bg="danger">Agotado</Badge>;
    if (stock < 10) return <Badge bg="warning" text="dark">Stock bajo ({stock})</Badge>;
    return <Badge bg="success">En stock ({stock})</Badge>;
  };

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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleSelectBranch = (branchId: number, branchName: string) => {
    setSelectedBranch(branchId);
    setSelectedBranchName(branchName);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <>
        <Navbar bg="white" expand="lg" className="shadow-sm px-4 py-3">
          <Container fluid>
            <Navbar.Brand className="d-flex align-items-center gap-2">
              <Image src="/images/logo.png" alt="Logo" width={35} height={35} style={{ objectFit: 'contain' }} />
              <span className="fw-bold text-primary fs-4">Stocky</span>
              <Badge bg="info" className="ms-2">Trabajador</Badge>
            </Navbar.Brand>
          </Container>
        </Navbar>
        <Container className="py-5 text-center">
          <i className="bi bi-exclamation-triangle fs-1 text-warning"></i>
          <h4 className="mt-3">No tienes sucursales asignadas</h4>
          <p className="text-muted">Contacta al administrador para que te asigne una sucursal</p>
          <Button variant="primary" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar bg="white" expand="lg" className="shadow-sm px-4 py-3">
        <Container fluid>
          <Navbar.Brand className="d-flex align-items-center gap-2">
            <Image src="/images/logo.png" alt="Logo" width={35} height={35} style={{ objectFit: 'contain' }} />
            <span className="fw-bold text-primary fs-4">Stocky</span>
            <Badge bg="info" className="ms-2">Trabajador</Badge>
            <Badge bg="primary" className="ms-2">{selectedBranchName}</Badge>
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <div className="fw-semibold">{user?.name}</div>
                <small className="text-muted">{user?.email}</small>
              </div>
              <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>
                Cerrar Sesión
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="py-4 px-4 bg-light">
        
        {/* Header con selector de sucursal */}
        <div className="bg-gradient-primary rounded-4 p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
                <i className="bi bi-shop fs-2"></i>
              <div>
                <h2 className="mb-1 fw-bold">Panel de Trabajador</h2>
                <p className="mb-0 opacity-75">Bienvenido, {user?.name}</p>
              </div>
            </div>
            
            {/* Selector de sucursal (si tiene más de una) */}
            {branches.length > 1 && (
              <DropdownButton
                title={
                  <>
                    <i className="bi bi-building me-2"></i>
                    {selectedBranchName}
                  </>
                }
                variant="light"
                className="shadow-sm"
              >
                {branches.map((branch) => (
                  <Dropdown.Item 
                    key={branch.id}
                    onClick={() => handleSelectBranch(branch.id, branch.name)}
                    active={selectedBranch === branch.id}
                  >
                    <i className="bi bi-building me-2"></i>
                    {branch.name}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            )}
            
            {/* Si solo tiene una sucursal, mostrar el nombre */}
{branches.length === 1 && (
  <div className="bg-white bg-opacity-10 rounded-3 px-4 py-2 backdrop-blur-sm">
    <i className="bi bi-building me-2 text-white"></i>
    <span className="text-white fw-semibold">{branches[0].name}</span>
  </div>
)}
          </div>
        </div>

        {/* Información de la sucursal seleccionada */}
        {branches.find(b => b.id === selectedBranch) && (
          <div className="bg-white rounded-4 p-3 mb-4 shadow-sm border border-primary">
            <Row className="align-items-center">
              <Col md={6}>
                <small className="text-muted">
                  <i className="bi bi-geo-alt text-primary me-1"></i>
                  {branches.find(b => b.id === selectedBranch)?.address || 'Dirección no disponible'}
                </small>
              </Col>
              <Col md={6} className="text-md-end">
                <small className="text-muted">
                  <i className="bi bi-telephone text-primary me-1"></i>
                  {branches.find(b => b.id === selectedBranch)?.phone || 'Teléfono no disponible'}
                </small>
              </Col>
            </Row>
          </div>
        )}

        {/* Tarjetas de Acciones Rápidas */}
<Row className="g-4 mb-4 justify-content-center">
          <Col md={4}>
            <Card className="border-0 shadow-sm text-center p-3 h-100 cursor-pointer hover-card" onClick={() => router.push('/worker/sales')}>
              <Card.Body>
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <i className="bi bi-cart-plus fs-1 text-primary"></i>
                </div>
                <Card.Title>Registrar Venta</Card.Title>
                <Card.Text className="text-muted small">
                  Realiza una nueva venta a clientes
                </Card.Text>
                <Button variant="outline-primary" size="sm">
                  Nueva Venta <i className="bi bi-arrow-right-short"></i>
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="border-0 shadow-sm text-center p-3 h-100 cursor-pointer hover-card" onClick={() => router.push('/worker/reports')}>
              <Card.Body>
                <div className="bg-info bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <i className="bi bi-file-text fs-1 text-info"></i>
                </div>
                <Card.Title>Reporte de Ventas</Card.Title>
                <Card.Text className="text-muted small">
                  Envía reporte de ventas del día al administrador
                </Card.Text>
                <Button variant="outline-info" size="sm">
                  Ver Reportes <i className="bi bi-arrow-right-short"></i>
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        .transition {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .hover-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .product-card-image {
          transition: transform 0.3s ease;
        }
        .product-card-image:hover {
          transform: scale(1.05);
        }
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .bg-purple {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }
        .border-primary {
          border-color: #667eea !important;
        }
      `}</style>
    </>
  );
}