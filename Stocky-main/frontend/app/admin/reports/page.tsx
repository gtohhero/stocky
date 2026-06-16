'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Alert,
  Modal
} from 'react-bootstrap';

interface DailyReport {
  id: number;
  seller_id: number;
  seller_name: string;
  branch_id: number;
  branch_name: string;
  report_date: string;
  total_sales: number;
  total_revenue: number;
  total_profit: number;
  sales_details: any[];
  status: string;
  created_at: string;
}

export default function AdminReports() {

  const [reports, setReports] =
    useState<DailyReport[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [selectedReport, setSelectedReport] =
    useState<DailyReport | null>(null);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [updating, setUpdating] =
    useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData!);

    if (user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchReports();

  }, []);

  const fetchReports = async () => {

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        'http://localhost:5001/api/admin/reports/daily',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      setReports(data);

    } catch (error) {

      console.error('Error:', error);
      setError('Error al cargar los reportes');

    } finally {

      setLoading(false);

    }
  };

  const updateReportStatus = async (
    id: number,
    status: string
  ) => {

    setUpdating(id);

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        `http://localhost:5001/api/admin/reports/${id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      if (res.ok) {

        setReports(
          reports.map((report) =>
            report.id === id
              ? { ...report, status }
              : report
          )
        );

      } else {

        alert('Error al cambiar el estado');

      }

    } catch (error) {

      console.error('Error:', error);
      alert('Error de conexión');

    } finally {

      setUpdating(null);

    }
  };

  const formatCurrency = (amount: number) => {

    return new Intl.NumberFormat(
      'es-MX',
      {
        style: 'currency',
        currency: 'MXN'
      }
    ).format(amount);

  };

  const handleViewDetails = (
    report: DailyReport
  ) => {

    setSelectedReport(report);
    setShowDetailsModal(true);

  };

  const handleLogout = () => {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    router.push('/login');

  };

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
              <i className="bi bi-file-earmark-text me-2"></i>
              Reportes
            </Badge>

            <div className="action-buttons-group">

              <button
                className="dashboard-btn"
                onClick={() =>
                  router.push('/admin/dashboard')
                }
              >
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </button>

              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Salir
              </button>

            </div>

          </div>

        </div>

        {/* CONTENT */}
        <Container
          fluid
          className="main-content-wrapper"
        >

          {/* HERO */}
          <div className="hero-banner">

            <div>

              <h1 className="hero-title">
                Reportes de Ventas
              </h1>

              <p className="hero-subtitle">
                Visualiza reportes diarios enviados
                por los trabajadores y controla el
                estado de revisión.
              </p>

            </div>

            <div className="hero-icon-wrapper">
              <i className="bi bi-clipboard-data"></i>
            </div>

          </div>

          {/* ERROR */}
          {error && (
            <Alert
              variant="danger"
              className="border-0 rounded-4 shadow-sm"
            >
              {error}
            </Alert>
          )}

          {/* STATS */}
          <Row className="g-4 mb-4">

            <Col md={4}>
              <div className="stats-card">

                <div>
                  <p>Total Reportes</p>
                  <h3>{reports.length}</h3>
                </div>

                <i className="bi bi-file-earmark-text"></i>

              </div>
            </Col>

            <Col md={4}>
              <div className="stats-card">

                <div>
                  <p>Pendientes</p>

                  <h3 className="text-warning">
                    {
                      reports.filter(
                        r =>
                          r.status === 'PENDING'
                      ).length
                    }
                  </h3>
                </div>

                <i className="bi bi-clock-history"></i>

              </div>
            </Col>

            <Col md={4}>
              <div className="stats-card">

                <div>
                  <p>Revisados</p>

                  <h3 className="text-success">
                    {
                      reports.filter(
                        r =>
                          r.status === 'REVIEWED'
                      ).length
                    }
                  </h3>
                </div>

                <i className="bi bi-check-circle"></i>

              </div>
            </Col>

          </Row>

          {/* TABLE */}
          <Card className="glass-card border-0 overflow-hidden">

            <div className="table-responsive">

              <Table className="table-custom mb-0 align-middle">

                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Trabajador</th>
                    <th>Sucursal</th>
                    <th className="text-end">
                      Ventas
                    </th>
                    <th className="text-end">
                      Ingresos
                    </th>
                    <th className="text-end">
                      Ganancia
                    </th>
                    <th className="text-center">
                      Estado
                    </th>
                    <th className="text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {reports.length === 0 ? (

                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-5"
                      >
                        <div className="empty-state">

                          <i className="bi bi-inbox"></i>

                          <p>
                            No hay reportes enviados
                          </p>

                        </div>
                      </td>
                    </tr>

                  ) : (

                    reports.map((report) => (

                      <tr key={report.id}>

                        <td>
                          <span className="fw-semibold text-dark">
                            {
                              new Date(
                                report.report_date
                              ).toLocaleDateString()
                            }
                          </span>
                        </td>

                        <td>

                          <div className="fw-semibold text-dark">
                            {report.seller_name}
                          </div>

                          <small className="text-muted">
                            ID: {report.seller_id}
                          </small>

                        </td>

                        <td>

                          <Badge bg="info">
                            {report.branch_name ||
                              'No especificada'}
                          </Badge>

                        </td>

                        <td className="text-end fw-bold text-dark">
                          {report.total_sales}
                        </td>

                        <td className="text-end fw-bold text-success">
                          {formatCurrency(
                            report.total_revenue
                          )}
                        </td>

                        <td className="text-end fw-bold text-primary">
                          {formatCurrency(
                            report.total_profit
                          )}
                        </td>

                        <td className="text-center">

                          <Badge
                            bg={
                              report.status ===
                              'PENDING'
                                ? 'warning'
                                : 'success'
                            }
                            text={
                              report.status ===
                              'PENDING'
                                ? 'dark'
                                : 'light'
                            }
                          >
                            {report.status ===
                            'PENDING'
                              ? 'Pendiente'
                              : 'Revisado'}
                          </Badge>

                        </td>

                        <td className="text-center">

                          <div className="d-flex gap-2 justify-content-center">

                            {report.status ===
                            'PENDING' ? (

                              <Button
                                variant="success"
                                size="sm"
                                className="rounded-pill px-3"
                                onClick={() =>
                                  updateReportStatus(
                                    report.id,
                                    'REVIEWED'
                                  )
                                }
                                disabled={
                                  updating ===
                                  report.id
                                }
                              >
                                {updating ===
                                report.id ? (
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                  />
                                ) : (
                                  <>
                                    <i className="bi bi-check-circle me-1"></i>
                                    Revisar
                                  </>
                                )}
                              </Button>

                            ) : (

                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-pill px-3"
                                disabled
                              >
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Revisado
                              </Button>

                            )}

                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="rounded-pill px-3"
                              onClick={() =>
                                handleViewDetails(
                                  report
                                )
                              }
                            >
                              <i className="bi bi-eye me-1"></i>
                              Ver
                            </Button>

                          </div>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </Table>

            </div>

          </Card>

        </Container>

      </div>

      {/* MODAL */}
      <Modal
        show={showDetailsModal}
        onHide={() =>
          setShowDetailsModal(false)
        }
        size="lg"
        centered
      >

        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-receipt me-2"></i>
            Detalles del Reporte
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>

          {selectedReport && (
            <>

              <Row className="g-3 mb-4">

                <Col md={4}>
                  <div className="detail-stat-card">

                    <small>Ventas</small>

                    <h5>
                      {
                        selectedReport.total_sales
                      }
                    </h5>

                  </div>
                </Col>

                <Col md={4}>
                  <div className="detail-stat-card">

                    <small>Ingresos</small>

                    <h5 className="text-success">
                      {formatCurrency(
                        selectedReport.total_revenue
                      )}
                    </h5>

                  </div>
                </Col>

                <Col md={4}>
                  <div className="detail-stat-card">

                    <small>Ganancia</small>

                    <h5 className="text-primary">
                      {formatCurrency(
                        selectedReport.total_profit
                      )}
                    </h5>

                  </div>
                </Col>

              </Row>

              <h6 className="fw-bold mb-3">
                Productos vendidos
              </h6>

              {selectedReport.sales_details &&
              selectedReport.sales_details
                .length > 0 ? (

                selectedReport.sales_details.map(
                  (sale, idx) => (

                    <div
                      key={idx}
                      className="sale-card"
                    >

                      <div className="d-flex justify-content-between align-items-center mb-3">

                        <div>

                          <h6 className="fw-bold mb-1">
                            Factura:{' '}
                            {sale.invoice}
                          </h6>

                          <small className="text-muted">
                            Cliente:{' '}
                            {sale.client}
                          </small>

                        </div>

                        <Badge bg="secondary">
                          {sale.payment}
                        </Badge>

                      </div>

                      <div className="table-responsive">

                        <table className="table align-middle">

                          <thead className="table-light">

                            <tr>
                              <th>Producto</th>
                              <th className="text-end">
                                Cantidad
                              </th>
                              <th className="text-end">
                                Precio
                              </th>
                              <th className="text-end">
                                Subtotal
                              </th>
                            </tr>

                          </thead>

                          <tbody>

                            {sale.items &&
                              sale.items.map(
                                (
                                  item: any,
                                  itemIdx: number
                                ) => (

                                  <tr
                                    key={itemIdx}
                                  >

                                    <td>
                                      {
                                        item.product_name
                                      }
                                    </td>

                                    <td className="text-end">
                                      {
                                        item.quantity
                                      }
                                    </td>

                                    <td className="text-end">
                                      {formatCurrency(
                                        item.unit_price
                                      )}
                                    </td>

                                    <td className="text-end fw-bold text-primary">
                                      {formatCurrency(
                                        item.subtotal
                                      )}
                                    </td>

                                  </tr>

                                )
                              )}

                          </tbody>

                        </table>

                      </div>

                    </div>

                  )
                )

              ) : (

                <p className="text-muted text-center">
                  No hay detalles de productos
                </p>

              )}

            </>
          )}

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setShowDetailsModal(false)
            }
          >
            Cerrar
          </Button>

        </Modal.Footer>

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
          position: relative;
          overflow: hidden;
          padding-bottom: 4rem;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          width: 650px;
          height: 650px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          top: -250px;
          right: -150px;
        }

        .panel-top-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.3rem 2rem;
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .panel-left-section {
          display: flex;
          align-items: center;
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
          border: 1px solid rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
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
          transition: 0.3s;
          font-weight: 600;
        }

        .dashboard-btn:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

        .logout-btn:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .main-content-wrapper {
          padding-top: 2rem;
        }

        .hero-banner {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 30px;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
        }

        .hero-title {
          color: white;
          font-size: 3rem;
          font-weight: 800;
        }

        .hero-subtitle {
          color: rgba(255,255,255,0.75);
          margin-top: 10px;
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

        .stats-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          padding: 1.5rem;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(12px);
          transition: 0.3s;
        }

        .stats-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.12);
        }

        .stats-card p {
          margin: 0;
          color: rgba(255,255,255,0.7);
        }

        .stats-card i {
          font-size: 2rem;
        }

        .glass-card {
          background: rgba(255,255,255,0.95) !important;
          border-radius: 28px !important;
          overflow: hidden;
        }

        .table-custom thead {
          background: #f8fafc;
        }

        .table-custom th {
          color: #334155;
          font-weight: 700;
          border: none;
          padding: 1rem;
        }

        .table-custom td {
          padding: 1rem;
          vertical-align: middle;
          border-color: #e2e8f0;
        }

        .empty-state i {
          font-size: 4rem;
          color: #94a3b8;
        }

        .empty-state p {
          margin-top: 10px;
          color: #64748b;
          font-weight: 500;
        }

        .detail-stat-card {
          background: #f8fafc;
          border-radius: 18px;
          padding: 1rem;
          text-align: center;
        }

        .detail-stat-card small {
          color: #64748b;
        }

        .detail-stat-card h5 {
          margin-top: 5px;
          font-weight: 700;
        }

        .sale-card {
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1rem;
          margin-bottom: 1rem;
          background: #fff;
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

          .hero-title {
            font-size: 2rem;
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

          .hero-banner {
            padding: 1.5rem;
          }
        }

      `}</style>
    </>
  );
}