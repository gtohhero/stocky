'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Container, Row, Col, Card, Button, Navbar, Nav, Spinner, Badge, Table, Alert, Modal } from 'react-bootstrap';

interface Sale {
  id: number;
  invoice_number: string;
  total_amount: number;
  total_profit: number;
  payment_method: string;
  client_name: string;
  sale_date: string;
  seller_name: string;
  branch_name: string;
  branch_id: number;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

interface Summary {
  total_sales: number;
  total_revenue: number;
  total_profit: number;
}

interface Branch {
  id: number;
  name: string;
  address: string;
}

export default function WorkerReports() {
  const [user, setUser] = useState<any>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
    if (parsedUser.role !== 'WORKER' && parsedUser.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    
    setUser(parsedUser);
    fetchWorkerBranches(parsedUser.id);
    fetchTodaySales(parsedUser.id);
  }, []);

  const fetchWorkerBranches = async (userId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5001/api/users/${userId}/branches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const branchesList = Array.isArray(data) ? data : [];
      setBranches(branchesList);
    } catch (error) {
      console.error('Error:', error);
      setBranches([]);
    }
  };

  const fetchTodaySales = async (userId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5001/api/worker/sales/today?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSales(data.sales || []);
      setSummary(data.summary || { total_sales: 0, total_revenue: 0, total_profit: 0 });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async () => {
    setSending(true);
    const token = localStorage.getItem('token');
    
    let branchId = null;
    let branchName = '';
    
    if (sales.length > 0 && sales[0].branch_id) {
      branchId = sales[0].branch_id;
      branchName = sales[0].branch_name;
    } else if (branches.length > 0) {
      branchId = branches[0].id;
      branchName = branches[0].name;
    }
    
    const reportData = {
      seller_id: user.id,
      seller_name: user.name,
      branch_id: branchId,
      branch_name: branchName,
      report_date: new Date().toISOString().split('T')[0],
      sales_summary: summary,
      sales_details: sales.map(sale => ({
        invoice: sale.invoice_number,
        client: sale.client_name,
        amount: sale.total_amount,
        payment: sale.payment_method,
        time: new Date(sale.sale_date).toLocaleTimeString(),
        items: sale.items
      }))
    };
    
    try {
      const res = await fetch('http://localhost:5001/api/worker/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setModalMessage('Reporte enviado exitosamente al administrador');
        setModalVariant('success');
        setShowModal(true);
      } else {
        setModalMessage(data.error || 'Error al enviar el reporte');
        setModalVariant('danger');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setModalMessage('Error de conexión');
      setModalVariant('danger');
      setShowModal(true);
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <Navbar bg="white" expand="lg" className="shadow-sm px-4 py-3">
        <Container fluid>
          <Navbar.Brand className="d-flex align-items-center gap-2">
            <Image src="/images/logo.png" alt="Logo" width={35} height={35} style={{ objectFit: 'contain' }} />
            <span className="fw-bold text-primary fs-5">Stocky</span>
            <Badge bg="info" className="ms-2">Reporte de Ventas</Badge>
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
        
        {/* Header con información del trabajador */}
        <div className="bg-gradient-primary rounded-4 p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-circle p-3">
                <i className="bi bi-file-text fs-2"></i>
              </div>
              <div>
                <h2 className="mb-1 fw-bold">Reporte de Ventas</h2>
                <p className="mb-0 opacity-75">
                  <i className="bi bi-person me-1"></i>{user?.name} | 
                  <i className="bi bi-calendar me-1 ms-2"></i>{new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button 
              variant="light" 
              className="px-4 py-2"
              onClick={handleSendReport}
              disabled={sending || sales.length === 0}
            >
              <i className="bi bi-send me-2"></i>
              {sending ? 'Enviando...' : 'Enviar Reporte al Administrador'}
            </Button>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        {summary && (
          <Row className="g-4 mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 hover-card">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Ventas Realizadas</p>
                      <h2 className="mb-0 fw-bold">{summary.total_sales}</h2>
                    </div>
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-receipt fs-3 text-primary"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 hover-card">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Ingresos Totales</p>
                      <h2 className="mb-0 fw-bold text-success">{formatCurrency(summary.total_revenue)}</h2>
                    </div>
                    <div className="bg-success bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-cash-stack fs-3 text-success"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 hover-card">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Ganancia Estimada</p>
                      <h2 className="mb-0 fw-bold text-info">{formatCurrency(summary.total_profit)}</h2>
                    </div>
                    <div className="bg-info bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-graph-up fs-3 text-info"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Tabla de ventas */}
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Header className="bg-white py-3 px-4">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-list-ul me-2 text-primary"></i>
                Ventas del día
              </h5>
              <Badge bg="secondary" className="rounded-pill">
                {sales.length} ventas
              </Badge>
            </div>
          </Card.Header>
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Factura</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Pago</th>
                  <th>Hora</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1"></i>
                      <p className="mt-2">No hay ventas registradas hoy</p>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <span className="fw-semibold">{sale.invoice_number}</span>
                        <br />
                        <small className="text-muted">ID: {sale.id}</small>
                      </td>
                      <td>{sale.client_name}</td>
                      <td className="fw-bold text-primary">{formatCurrency(sale.total_amount)}</td>
                      <td>
                        <Badge bg={
                          sale.payment_method === 'EFECTIVO' ? 'success' : 
                          sale.payment_method === 'TARJETA' ? 'info' : 'secondary'
                        }>
                          {sale.payment_method}
                        </Badge>
                      </td>
                      <td>{new Date(sale.sale_date).toLocaleTimeString()}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => {
                            const items = sale.items.map((item) => 
                              `${item.product_name} x${item.quantity} = $${item.subtotal}`
                            ).join('\n');
                            alert(`Detalles:\n${items}\n\nTotal: $${sale.total_amount}`);
                          }}
                        >
                          <i className="bi bi-eye me-1"></i>Ver
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        {/* Información del trabajador */}
        <Card className="border-0 shadow-sm rounded-4 mt-4 bg-light">
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary rounded-circle p-3">
                    <i className="bi bi-person-badge fs-4 text-white"></i>
                  </div>
                  <div>
                    <h6 className="mb-1 fw-semibold">Reporte generado por</h6>
                    <p className="mb-0 text-muted">
                      <strong>{user?.name}</strong> - {user?.email}
                    </p>
                  </div>
                </div>
              </Col>
              <Col md={4} className="text-md-end mt-3 mt-md-0">
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  Generado el: {new Date().toLocaleString()}
                </small>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Botón flotante para enviar reporte */}
        {sales.length > 0 && (
          <div className="position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1000 }}>
            <Button 
              variant="success" 
              size="lg" 
              className="rounded-pill shadow-lg"
              onClick={handleSendReport}
              disabled={sending}
            >
              <i className="bi bi-send me-2"></i>
              {sending ? 'Enviando...' : 'Enviar Reporte al Administrador'}
            </Button>
          </div>
        )}
      </Container>

      {/* Modal de notificación */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalVariant === 'success' ? 'Reporte Enviado' : 'Error'}</Modal.Title>
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
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
      `}</style>
    </>
  );
}