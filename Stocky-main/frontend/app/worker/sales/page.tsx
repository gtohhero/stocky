'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Container, Row, Col, Card, Button, Navbar, Nav, Spinner, Badge, Table, Form, InputGroup, Modal, Alert, Dropdown, DropdownButton } from 'react-bootstrap';

interface Product {
  id: number;
  name: string;
  selling_price: number;
  stock: number;
  category: string;
  image_url: string;
}

interface Branch {
  id: number;
  name: string;
  address: string;
}

interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  image_url: string;
}

export default function WorkerSales() {
  const [user, setUser] = useState<any>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalVariant, setModalVariant] = useState<'success' | 'danger'>('success');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData!);
    if (parsedUser.role === 'CLIENT') {
      router.push('/');
      return;
    }
    setUser(parsedUser);
    fetchWorkerBranches(parsedUser.id);
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchProducts();
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
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!selectedBranch) return;
    setLoadingProducts(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5001/api/products/branch/${selectedBranch}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      setModalMessage('Producto agotado');
      setModalVariant('danger');
      setShowModal(true);
      return;
    }

    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        setModalMessage(`Stock máximo: ${product.stock} unidades`);
        setModalVariant('danger');
        setShowModal(true);
        return;
      }
      const updatedCart = cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        price: product.selling_price,
        subtotal: product.selling_price,
        image_url: product.image_url || ''
      }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (product && quantity > product.stock) {
      setModalMessage(`Stock máximo: ${product.stock} unidades`);
      setModalVariant('danger');
      setShowModal(true);
      return;
    }
    const updatedCart = cart.map(item => 
      item.product_id === productId 
        ? { ...item, quantity, subtotal: quantity * item.price }
        : item
    );
    setCart(updatedCart);
  };

  // Calcular total correctamente
  const totalAmount = cart.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setModalMessage('Agrega productos al carrito');
      setModalVariant('danger');
      setShowModal(true);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5001/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
          client_name: 'Cliente mostrador',
          client_phone: '',
          payment_method: paymentMethod,
          seller_id: user?.id,
          branch_id: selectedBranch
        })
      });

      const data = await res.json();
      if (res.ok) {
        setModalMessage(`✅ Venta registrada exitosamente. Total: $${totalAmount.toFixed(2)}`);
        setModalVariant('success');
        setShowModal(true);
        setCart([]);
        fetchProducts();
      } else {
        setModalMessage(data.error || 'Error al registrar venta');
        setModalVariant('danger');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setModalMessage('Error de conexión');
      setModalVariant('danger');
      setShowModal(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && p.stock > 0
  );

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
              <span className="fw-bold text-primary">Stocky</span>
              <Badge bg="info">Trabajador</Badge>
            </Navbar.Brand>
          </Container>
        </Navbar>
        <Container className="py-5 text-center">
          <i className="bi bi-exclamation-triangle fs-1 text-warning"></i>
          <h4 className="mt-3">No tienes sucursales asignadas</h4>
          <p className="text-muted">Contacta al administrador para poder realizar ventas</p>
          <Button variant="primary" onClick={handleLogout}>Cerrar Sesión</Button>
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
            <span className="fw-bold text-primary">Stocky</span>
            <Badge bg="success" className="ms-2">Registrar Venta</Badge>
            <Badge bg="info" className="ms-2">{branches.find(b => b.id === selectedBranch)?.name}</Badge>
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={() => router.push('/worker/dashboard')}>
                <i className="bi bi-speedometer2 me-1"></i>Dashboard
              </Button>
              <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>Salir
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="py-4 px-4 bg-light">
        <Row className="g-4">
          {/* Productos */}
          <Col lg={7}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Header className="bg-white fw-semibold">
                <i className="bi bi-box-seam me-2"></i>Productos Disponibles
                {branches.length > 1 && (
                  <DropdownButton
                    title={branches.find(b => b.id === selectedBranch)?.name}
                    variant="outline-secondary"
                    size="sm"
                    className="ms-2 d-inline-block"
                  >
                    {branches.map((branch) => (
                      <Dropdown.Item key={branch.id} onClick={() => setSelectedBranch(branch.id)}>
                        {branch.name}
                      </Dropdown.Item>
                    ))}
                  </DropdownButton>
                )}
              </Card.Header>
              <Card.Body>
                <Form.Control 
                  type="text" 
                  placeholder="Buscar producto..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  className="mb-3"
                />
                {loadingProducts ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    <Row className="g-3">
                      {filteredProducts.map((product) => (
                        <Col key={product.id} xs={12} sm={6} md={4}>
                          <Card className="h-100 border-0 shadow-sm hover-card">
                            <div className="text-center p-3 bg-light rounded-top" style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                                  className="product-image"
                                />
                              ) : (
                                <i className={`${getProductIcon(product.category)} fs-1 text-secondary`}></i>
                              )}
                            </div>
                            <Card.Body className="text-center p-3">
                              <Card.Title className="fs-6 fw-semibold mb-1">{product.name}</Card.Title>
                              <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                                <span className="text-primary fw-bold fs-4">${product.selling_price}</span>
                                <Badge bg={product.stock < 10 ? 'warning' : 'secondary'} className="rounded-pill">
                                  Stock: {product.stock}
                                </Badge>
                              </div>
                              <Button 
                                size="sm" 
                                variant="primary" 
                                className="w-100 rounded-pill"
                                onClick={() => addToCart(product)}
                                disabled={product.stock === 0}
                              >
                                <i className="bi bi-cart-plus me-1"></i>
                                {product.stock === 0 ? 'Agotado' : 'Agregar'}
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Carrito */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Header className="bg-white fw-semibold">
                <i className="bi bi-cart me-2"></i>Carrito de Venta
                {cart.length > 0 && (
                  <Badge bg="primary" className="ms-2 rounded-pill">{cart.length} productos</Badge>
                )}
              </Card.Header>
              <Card.Body>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {cart.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-cart fs-1 text-muted"></i>
                      <p className="text-muted mt-2">Carrito vacío</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {cart.map((item) => (
                        <div key={item.product_id} className="d-flex align-items-center gap-3 p-2 border rounded-3 bg-white">
                          <div className="bg-light rounded p-1" style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                              />
                            ) : (
                              <i className="bi bi-capsule fs-2 text-secondary"></i>
                            )}
                          </div>
                          
                          <div className="flex-grow-1">
                            <div className="fw-semibold small">{item.name}</div>
                            <div className="d-flex justify-content-between align-items-center mt-1">
                              <div>
                                <span className="text-primary fw-bold">${item.price}</span>
                                <span className="text-muted small"> c/u</span>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm"
                                  className="rounded-circle p-0"
                                  style={{ width: '28px', height: '28px' }}
                                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                >
                                  <i className="bi bi-dash"></i>
                                </Button>
                                <span className="fw-semibold" style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="rounded-circle p-0"
                                  style={{ width: '28px', height: '28px' }}
                                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                >
                                  <i className="bi bi-plus"></i>
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-end">
                            <div className="fw-bold text-primary">${item.price * item.quantity}</div>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-danger p-0 mt-1"
                              onClick={() => removeFromCart(item.product_id)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr className="my-3" />
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Subtotal:</span>
                  <span className="fw-semibold">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">IVA (0%):</span>
                  <span className="fw-semibold">$0.00</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3 pt-2 border-top">
                  <span className="fs-5 fw-bold">Total:</span>
                  <span className="fs-4 fw-bold text-primary">${totalAmount.toFixed(2)}</span>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">
                    <i className="bi bi-credit-card me-1"></i>Método de pago
                  </Form.Label>
                  <div className="d-flex gap-2">
                    <Button 
                      variant={paymentMethod === 'EFECTIVO' ? 'primary' : 'outline-secondary'}
                      className="flex-grow-1 rounded-pill"
                      onClick={() => setPaymentMethod('EFECTIVO')}
                    >
                      <i className="bi bi-cash-stack me-1"></i>Efectivo
                    </Button>
                    <Button 
                      variant={paymentMethod === 'TARJETA' ? 'primary' : 'outline-secondary'}
                      className="flex-grow-1 rounded-pill"
                      onClick={() => setPaymentMethod('TARJETA')}
                    >
                      <i className="bi bi-credit-card me-1"></i>Tarjeta
                    </Button>
                    <Button 
                      variant={paymentMethod === 'TRANSFERENCIA' ? 'primary' : 'outline-secondary'}
                      className="flex-grow-1 rounded-pill"
                      onClick={() => setPaymentMethod('TRANSFERENCIA')}
                    >
                      <i className="bi bi-bank2 me-1"></i>Transferencia
                    </Button>
                  </div>
                </Form.Group>

                <Button 
                  variant="success" 
                  className="w-100 py-2 mt-2 rounded-pill" 
                  onClick={handleSubmit} 
                  disabled={cart.length === 0}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Finalizar Venta - ${totalAmount.toFixed(2)}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalVariant === 'success' ? 'Venta Exitosa' : 'Error'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={modalVariant} className="mb-0">{modalMessage}</Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .hover-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important;
        }
        .product-image {
          transition: transform 0.3s ease;
        }
        .product-image:hover {
          transform: scale(1.05);
        }
      `}</style>
    </>
  );
}