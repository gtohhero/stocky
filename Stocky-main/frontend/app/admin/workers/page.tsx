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
  Modal,
  Form,
  Alert
} from 'react-bootstrap';

interface Worker {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  branches: { id: number; name: string }[];
}

interface Branch {
  id: number;
  name: string;
  address: string;
}

export default function AdminWorkers() {

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [modalMode, setModalMode] =
    useState<'add' | 'edit'>('add');

  const [selectedWorker, setSelectedWorker] =
    useState<Worker | null>(null);

  const [selectedBranches, setSelectedBranches] =
    useState<number[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'WORKER'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    fetchWorkers();
    fetchBranches();

  }, []);

  const fetchWorkers = async () => {

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        'http://localhost:5001/api/workers',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      setWorkers(data);

    } catch (error) {

      console.error('Error:', error);

    } finally {

      setLoading(false);

    }
  };

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

      setBranches(data);

    } catch (error) {

      console.error('Error:', error);

    }
  };

  const handleSave = async () => {

    setError('');
    setSuccess('');

    if (
      !formData.name ||
      !formData.email ||
      !formData.password
    ) {
      setError('Todos los campos son requeridos');
      return;
    }

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        'http://localhost:5001/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await res.json();

      if (res.ok) {

        if (selectedBranches.length > 0) {

          await fetch(
            `http://localhost:5001/api/users/${data.user.id}/branches`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                branchIds: selectedBranches
              })
            }
          );
        }

        setSuccess(
          'Trabajador agregado exitosamente'
        );

        setTimeout(() => {

          setShowModal(false);
          fetchWorkers();
          resetForm();

        }, 1500);

      } else {

        setError(
          data.error ||
          'Error al agregar trabajador'
        );

      }

    } catch (error) {

      setError('Error de conexión');

    }
  };

  const openAssignBranchesModal = (
    worker: Worker
  ) => {

    setModalMode('edit');
    setSelectedWorker(worker);

    setSelectedBranches(
      worker.branches.map((b) => b.id)
    );

    setShowModal(true);

  };

  const handleAssignBranches = async () => {

    if (!selectedWorker) return;

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        `http://localhost:5001/api/users/${selectedWorker.id}/branches`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            branchIds: selectedBranches
          })
        }
      );

      if (res.ok) {

        setSuccess(
          'Sucursales asignadas correctamente'
        );

        setTimeout(() => {

          setShowModal(false);
          fetchWorkers();

        }, 1500);

      } else {

        setError(
          'Error al asignar sucursales'
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
        `¿Eliminar al trabajador "${name}"?`
      )
    ) return;

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        `http://localhost:5001/api/auth/users/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.ok) {

        setSuccess('Trabajador eliminado');

        fetchWorkers();

        setTimeout(
          () => setSuccess(''),
          2000
        );

      } else {

        setError('Error al eliminar');

      }

    } catch (error) {

      setError('Error de conexión');

    }
  };

  const resetForm = () => {

    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'WORKER'
    });

    setSelectedBranches([]);
    setSelectedWorker(null);
    setError('');

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

  const toggleBranch = (branchId: number) => {

    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );

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
                Gestión de Trabajadores
              </small>
            </div>

          </div>

          <div className="panel-right-section">

            <Badge
              bg="light"
              text="dark"
              className="px-3 py-2 rounded-pill"
            >
              <i className="bi bi-people me-2"></i>
              Administración
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
                Gestión de Trabajadores
              </h1>

              <p className="hero-subtitle">
                Administra empleados,
                permisos y sucursales.
              </p>

            </div>

            <button
              className="add-worker-btn"
              onClick={openAddModal}
            >
              <i className="bi bi-person-plus me-2"></i>
              Agregar Trabajador
            </button>

          </div>

          {error && (
            <Alert
              variant="danger"
              className="border-0 rounded-4 shadow-sm"
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              variant="success"
              className="border-0 rounded-4 shadow-sm"
            >
              {success}
            </Alert>
          )}

          {/* TABLE */}
          <Card className="glass-card border-0 overflow-hidden">

            <div className="p-4 border-bottom">

              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-table me-2 text-primary"></i>
                Lista de Trabajadores
              </h5>

            </div>

            <div className="table-responsive">

              <Table className="table-custom mb-0 align-middle">

                <thead>

                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Sucursales</th>
                    <th>Registro</th>
                    <th className="text-center">
                      Acciones
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {workers.length === 0 ? (

                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-5 text-muted"
                      >
                        No hay trabajadores
                      </td>
                    </tr>

                  ) : (

                    workers.map((worker) => (

                      <tr
                        key={worker.id}
                        className="worker-row"
                      >

                        <td className="fw-semibold">
                          {worker.name}
                        </td>

                        <td>
                          {worker.email}
                        </td>

                        <td>

                          <Badge
                            bg={
                              worker.role ===
                              'ADMIN'
                                ? 'danger'
                                : 'info'
                            }
                          >
                            {worker.role ===
                            'ADMIN'
                              ? 'Administrador'
                              : 'Trabajador'}
                          </Badge>

                        </td>

                        <td>

                          {worker.branches.length ===
                          0 ? (

                            <span className="text-muted">
                              Sin asignar
                            </span>

                          ) : (

                            <div className="d-flex flex-wrap gap-1">

                              {worker.branches.map(
                                (b) => (

                                  <Badge
                                    key={b.id}
                                    bg="secondary"
                                  >
                                    {b.name}
                                  </Badge>

                                )
                              )}

                            </div>

                          )}

                        </td>

                        <td>
                          {new Date(
                            worker.created_at
                          ).toLocaleDateString()}
                        </td>

                        <td className="text-center">

                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() =>
                              openAssignBranchesModal(
                                worker
                              )
                            }
                          >
                            <i className="bi bi-shop"></i>
                          </Button>

                          <Button
                            variant="outline-danger"
                            size="sm"
                            disabled={
                              worker.role ===
                              'ADMIN'
                            }
                            onClick={() =>
                              handleDelete(
                                worker.id,
                                worker.name
                              )
                            }
                          >
                            <i className="bi bi-trash"></i>
                          </Button>

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
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >

        <Modal.Header closeButton>

          <Modal.Title>

            {modalMode === 'add' ? (
              <>
                <i className="bi bi-person-plus me-2"></i>
                Agregar Trabajador
              </>
            ) : (
              <>
                <i className="bi bi-shop me-2"></i>
                Asignar Sucursales
              </>
            )}

          </Modal.Title>

        </Modal.Header>

        <Modal.Body>

          {modalMode === 'add' ? (

            <Form>

              <Form.Group className="mb-3">
                <Form.Label>
                  Nombre
                </Form.Label>

                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Correo
                </Form.Label>

                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Contraseña
                </Form.Label>

                <Form.Control
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password:
                        e.target.value
                    })
                  }
                />
              </Form.Group>

            </Form>

          ) : (

            <div className="border rounded-4 p-3">

              {branches.map((branch) => (

                <Form.Check
                  key={branch.id}
                  type="checkbox"
                  label={branch.name}
                  checked={selectedBranches.includes(
                    branch.id
                  )}
                  onChange={() =>
                    toggleBranch(branch.id)
                  }
                  className="mb-2"
                />

              ))}

            </div>

          )}

        </Modal.Body>

        <Modal.Footer>

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
            onClick={
              modalMode === 'add'
                ? handleSave
                : handleAssignBranches
            }
          >
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
          padding-bottom: 4rem;
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
        .logout-btn,
        .add-worker-btn {
          border: none;
          padding: 12px 22px;
          border-radius: 16px;
          background: rgba(255,255,255,0.12);
          color: white;
          transition: 0.3s;
          font-weight: 600;
        }

        .dashboard-btn:hover,
        .add-worker-btn:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

        .logout-btn:hover {
          background: #dc2626;
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

        .glass-card {
          background: rgba(255,255,255,0.95) !important;
          border-radius: 28px !important;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
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
          border-color: #e2e8f0;
        }

        .worker-row {
          transition: 0.3s;
        }

        .worker-row:hover {
          background: #f8fafc;
        }

        @media (max-width: 992px) {

          .panel-top-section,
          .hero-banner {
            flex-direction: column;
            gap: 20px;
          }

          .hero-title {
            font-size: 2rem;
          }

        }

      `}</style>
    </>
  );
}