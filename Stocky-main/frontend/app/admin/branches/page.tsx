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
  Modal,
  Form,
  Alert
} from 'react-bootstrap';

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  status: string;
  created_at: string;
}

export default function AdminBranches() {

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [modalMode, setModalMode] =
    useState<'add' | 'edit'>('add');

  const [selectedBranch, setSelectedBranch] =
    useState<Branch | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    status: 'ACTIVE'
  });

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

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

    fetchBranches();

  }, []);

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

      setBranches(
        Array.isArray(data) ? data : []
      );

    } catch (error) {

      console.error('Error:', error);
      setBranches([]);

    } finally {

      setLoading(false);

    }
  };

  const handleSave = async () => {

    setError('');
    setSuccess('');

    if (!formData.name) {

      setError('El nombre es requerido');
      return;

    }

    const token = localStorage.getItem('token');

    const url =
      modalMode === 'add'
        ? 'http://localhost:5001/api/branches'
        : `http://localhost:5001/api/branches/${selectedBranch?.id}`;

    const method =
      modalMode === 'add'
        ? 'POST'
        : 'PUT';

    try {

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {

        setSuccess(
          modalMode === 'add'
            ? 'Sucursal agregada exitosamente'
            : 'Sucursal actualizada exitosamente'
        );

        setTimeout(() => {

          setShowModal(false);
          fetchBranches();
          resetForm();

        }, 1500);

      } else {

        const data = await res.json();

        setError(
          data.error || 'Error al guardar'
        );

      }

    } catch (error) {

      setError('Error de conexión');

    }
  };

  const handleDelete = async (
    id: number,
    name: string
  ) => {

    if (
      !confirm(
        `¿Eliminar la sucursal "${name}"? Se eliminarán todos sus productos asociados.`
      )
    ) return;

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        `http://localhost:5001/api/branches/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.ok) {

        setSuccess(
          'Sucursal eliminada exitosamente'
        );

        fetchBranches();

        setTimeout(
          () => setSuccess(''),
          2000
        );

      } else {

        const data = await res.json();

        setError(
          data.error || 'Error al eliminar'
        );

      }

    } catch (error) {

      setError('Error de conexión');

    }
  };

  const resetForm = () => {

    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      manager: '',
      status: 'ACTIVE'
    });

    setSelectedBranch(null);
    setError('');

  };

  const openEditModal = (
    branch: Branch
  ) => {

    setModalMode('edit');

    setSelectedBranch(branch);

    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      manager: branch.manager || '',
      status: branch.status
    });

    setShowModal(true);

  };

  const openAddModal = () => {

    setModalMode('add');

    resetForm();

    setShowModal(true);

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
              <i className="bi bi-shop me-2"></i>
              Sucursales
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
                Gestión de Sucursales
              </h1>

              <p className="hero-subtitle">
                Administra las sucursales,
                información, estado y acceso
                a productos.
              </p>

            </div>

            <div className="d-flex align-items-center gap-3">

              <Button
                className="hero-add-btn"
                onClick={openAddModal}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nueva Sucursal
              </Button>

              <div className="hero-icon-wrapper">
                <i className="bi bi-building"></i>
              </div>

            </div>

          </div>

          {/* ALERTAS */}
          {error && (

            <Alert
              variant="danger"
              className="border-0 rounded-4 shadow-sm"
              dismissible
              onClose={() => setError('')}
            >
              {error}
            </Alert>

          )}

          {success && (

            <Alert
              variant="success"
              className="border-0 rounded-4 shadow-sm"
              dismissible
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>

          )}

          {/* CARDS */}
          <Row className="g-4">

            {branches.length === 0 ? (

              <Col xs={12}>

                <Card className="glass-card border-0 text-center p-5">

                  <Card.Body>

                    <i className="bi bi-shop fs-1 text-muted"></i>

                    <p className="text-muted mt-3">
                      No hay sucursales registradas
                    </p>

                    <Button
                      className="empty-btn"
                      onClick={openAddModal}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Crear primera sucursal
                    </Button>

                  </Card.Body>

                </Card>

              </Col>

            ) : (

              branches.map((branch) => (

                <Col
                  lg={4}
                  md={6}
                  key={branch.id}
                >

                  <Card className="branch-card border-0 h-100">

                    <Card.Body className="p-4">

                      <div className="branch-top-section">

                        <div className="branch-icon-wrapper">

                          <i className="bi bi-building"></i>

                        </div>

                        <Badge
                          bg={
                            branch.status === 'ACTIVE'
                              ? 'success'
                              : 'secondary'
                          }
                          className="px-3 py-2 rounded-pill"
                        >
                          {branch.status === 'ACTIVE'
                            ? 'Activa'
                            : 'Inactiva'}
                        </Badge>

                      </div>

                      <h4 className="branch-title">
                        {branch.name}
                      </h4>

                      <div className="branch-info-list">

                        {branch.address && (

                          <div className="branch-info-item">

                            <i className="bi bi-geo-alt"></i>

                            <span>
                              {branch.address}
                            </span>

                          </div>

                        )}

                        {branch.phone && (

                          <div className="branch-info-item">

                            <i className="bi bi-telephone"></i>

                            <span>
                              {branch.phone}
                            </span>

                          </div>

                        )}

                        {branch.email && (

                          <div className="branch-info-item">

                            <i className="bi bi-envelope"></i>

                            <span>
                              {branch.email}
                            </span>

                          </div>

                        )}

                        {branch.manager && (

                          <div className="branch-info-item">

                            <i className="bi bi-person"></i>

                            <span>
                              {branch.manager}
                            </span>

                          </div>

                        )}

                      </div>

                      <div className="branch-actions">

                        <button
                          className="products-btn"
                          onClick={() =>
                            router.push(
                              `/admin/products?branch=${branch.id}`
                            )
                          }
                        >
                          <i className="bi bi-box-seam me-2"></i>
                          Productos
                        </button>

                        <button
                          className="edit-btn"
                          onClick={() =>
                            openEditModal(branch)
                          }
                        >
                          <i className="bi bi-pencil me-2"></i>
                          Editar
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            handleDelete(
                              branch.id,
                              branch.name
                            )
                          }
                        >
                          <i className="bi bi-trash me-2"></i>
                          Eliminar
                        </button>

                      </div>

                    </Card.Body>

                  </Card>

                </Col>

              ))

            )}

          </Row>

        </Container>

      </div>

      {/* MODAL */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >

        <Modal.Header
          closeButton
          className="border-0 pb-0"
        >

          <Modal.Title className="fw-bold">

            {modalMode === 'add' ? (

              <>
                <i className="bi bi-building-add me-2"></i>
                Nueva Sucursal
              </>

            ) : (

              <>
                <i className="bi bi-pencil-square me-2"></i>
                Editar Sucursal
              </>

            )}

          </Modal.Title>

        </Modal.Header>

        <Modal.Body className="p-4">

          <Form>

            <Form.Group className="mb-3">

              <Form.Label>
                Nombre *
              </Form.Label>

              <Form.Control
                type="text"
                placeholder="Ej: Sucursal Centro"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value
                  })
                }
              />

            </Form.Group>

            <Row>

              <Col md={6}>

                <Form.Group className="mb-3">

                  <Form.Label>
                    Dirección
                  </Form.Label>

                  <Form.Control
                    type="text"
                    placeholder="Calle, número..."
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: e.target.value
                      })
                    }
                  />

                </Form.Group>

              </Col>

              <Col md={6}>

                <Form.Group className="mb-3">

                  <Form.Label>
                    Teléfono
                  </Form.Label>

                  <Form.Control
                    type="text"
                    placeholder="222-000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value
                      })
                    }
                  />

                </Form.Group>

              </Col>

            </Row>

            <Row>

              <Col md={6}>

                <Form.Group className="mb-3">

                  <Form.Label>
                    Correo
                  </Form.Label>

                  <Form.Control
                    type="email"
                    placeholder="correo@stocky.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value
                      })
                    }
                  />

                </Form.Group>

              </Col>

              <Col md={6}>

                <Form.Group className="mb-3">

                  <Form.Label>
                    Gerente
                  </Form.Label>

                  <Form.Control
                    type="text"
                    placeholder="Nombre del gerente"
                    value={formData.manager}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manager: e.target.value
                      })
                    }
                  />

                </Form.Group>

              </Col>

            </Row>

            <Form.Group className="mb-3">

              <Form.Label>
                Estado
              </Form.Label>

              <Form.Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value
                  })
                }
              >
                <option value="ACTIVE">
                  Activa
                </option>

                <option value="INACTIVE">
                  Inactiva
                </option>

              </Form.Select>

            </Form.Group>

          </Form>

        </Modal.Body>

        <Modal.Footer className="border-0">

          <Button
            variant="secondary"
            onClick={() =>
              setShowModal(false)
            }
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            onClick={handleSave}
          >
            <i className="bi bi-save me-2"></i>
            Guardar
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
          gap: 20px;
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
          flex-wrap: wrap;
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

        .hero-add-btn {
          border: none !important;
          border-radius: 18px !important;
          padding: 14px 22px !important;
          font-weight: 700 !important;
          background: white !important;
          color: #1e3a8a !important;
        }

        .hero-add-btn:hover {
          transform: translateY(-2px);
        }

        .glass-card {
          background: rgba(255,255,255,0.95) !important;
          border-radius: 28px !important;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        .branch-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 28px;
          backdrop-filter: blur(14px);
          color: white;
          transition: 0.3s;
        }

        .branch-card:hover {
          transform: translateY(-6px);
          background: rgba(255,255,255,0.12);
        }

        .branch-top-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .branch-icon-wrapper {
          width: 70px;
          height: 70px;
          border-radius: 22px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }

        .branch-title {
          font-weight: 800;
          margin-bottom: 1.2rem;
        }

        .branch-info-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .branch-info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(0, 0, 0, 0.8);
          font-size: 0.95rem;
        }

        .branch-info-item i {
          color: black;
        }

        .branch-actions {
          margin-top: 1.8rem;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .products-btn,
        .edit-btn,
        .delete-btn {
          border: none;
          border-radius: 14px;
          padding: 10px 16px;
          font-weight: 600;
          transition: 0.3s;
          color: white;
        }

        .products-btn {
          background: #2563eb;
        }

        .products-btn:hover {
          background: #1d4ed8;
        }

        .edit-btn {
          background: #64748b;
        }

        .edit-btn:hover {
          background: #475569;
        }

        .delete-btn {
          background: #dc2626;
        }

        .delete-btn:hover {
          background: #b91c1c;
        }

        .empty-btn {
          border-radius: 14px;
          padding: 12px 20px;
          font-weight: 600;
        }

        @media (max-width: 992px) {

          .panel-top-section {
            flex-direction: column;
            gap: 20px;
          }

          .panel-right-section {
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

          .panel-left-section,
          .panel-right-section {
            width: 100%;
            justify-content: center;
          }

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

          .hero-icon-wrapper {
            width: 90px;
            height: 90px;
            font-size: 2.3rem;
          }

          .branch-actions {
            flex-direction: column;
          }

          .products-btn,
          .edit-btn,
          .delete-btn {
            width: 100%;
          }

        }

      `}</style>
    </>
  );
}