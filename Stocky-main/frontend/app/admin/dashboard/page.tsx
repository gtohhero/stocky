'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import {
  Container,
  Row,
  Col,
  Spinner,
  Badge
} from 'react-bootstrap';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Stats {
  total_products: number;
  total_units: number;
  total_investment: number;
  total_value: number;
  total_profit: number;
  low_stock_count: number;
}

export default function AdminDashboard() {

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();

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

    fetchStats();

  }, []);

  const fetchStats = async () => {

    const token = localStorage.getItem('token');

    try {

      const res = await fetch(
        'http://localhost:5001/api/stats/branch/1',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      setStats(data);

    } catch (error) {

      console.error('Error fetching stats:', error);

      setError('Error al cargar estadísticas');

      setStats({
        total_products: 0,
        total_units: 0,
        total_investment: 0,
        total_value: 0,
        total_profit: 0,
        low_stock_count: 0
      });

    } finally {

      setLoading(false);

    }
  };

  const handleLogout = () => {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    router.push('/login');

  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Spinner animation="border" variant="light" />
      </div>
    );
  }

  return (
    <>
      {/* NAVBAR */}
      <div className="panel-top-section">

        {/* IZQUIERDA */}
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

        {/* DERECHA */}
        <div className="panel-right-section">

          <Badge
            bg="light"
            text="dark"
            className="px-3 py-2 rounded-pill"
          >
            <i className="bi bi-shield-check me-2"></i>
            Panel Administrativo
          </Badge>

          {/* BOTONES */}
          <div className="action-buttons-group">

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Salir
            </button>

          </div>

          {/* PERFIL ADMIN */}
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

      {/* HERO */}
      <section className="hero-section text-white">

        <Container fluid>

          <Row className="align-items-center min-vh-1">

            {/* IZQUIERDA */}
            <Col lg={7}>

              <h1 className="display-3 fw-bold mb-3">
                Bienvenido,
                <br />
                {user?.name}
              </h1>

              <p className="lead opacity-75 mb-5">
                Gestiona productos, trabajadores,
                estadísticas y sucursales desde un
                panel moderno, elegante y centralizado.
              </p>

              {/* ACCESOS */}
              <div className="quick-access-grid">

                <div
                  className="quick-card"
                  onClick={() => router.push('/admin/products')}
                >
                  <div className="quick-icon bg-primary">
                    <i className="bi bi-box-seam"></i>
                  </div>

                  <div>
                    <h5>Productos</h5>
                    <p>Inventario y stock</p>
                  </div>
                </div>

                <div
                  className="quick-card"
                  onClick={() => router.push('/admin/workers')}
                >
                  <div className="quick-icon bg-success">
                    <i className="bi bi-people"></i>
                  </div>

                  <div>
                    <h5>Trabajadores</h5>
                    <p>Gestionar empleados</p>
                  </div>
                </div>

                <div
                  className="quick-card"
                  onClick={() => router.push('/admin/stats')}
                >
                  <div className="quick-icon bg-info">
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>

                  <div>
                    <h5>Estadísticas</h5>
                    <p>Ventas y ganancias</p>
                  </div>
                </div>

                <div
                  className="quick-card"
                  onClick={() => router.push('/admin/branches')}
                >
                  <div className="quick-icon bg-secondary">
                    <i className="bi bi-shop"></i>
                  </div>

                  <div>
                    <h5>Sucursales</h5>
                    <p>Administrar tiendas</p>
                  </div>
                </div>

                <div
                  className="quick-card"
                  onClick={() => router.push('/admin/reports')}
                >
                  <div className="quick-icon bg-warning">
                    <i className="bi bi-file-earmark-text"></i>
                  </div>

                  <div>
                    <h5>Reportes</h5>
                    <p>Ver reportes de ventas</p>
                  </div>
                </div>

              </div>

              {error && (
                <div className="alert alert-warning mt-4">
                  {error}
                </div>
              )}

            </Col>

            {/* DERECHA */}
            <Col lg={5} className="text-center mt-5 mt-lg-0">

              <div className="hero-image-container">

                <div className="floating-card card-1 shadow">
                  <i className="bi bi-capsule-pill text-primary fs-2"></i>
                </div>

                <div className="floating-card card-2 shadow">
                  <i className="bi bi-clipboard2-pulse text-success fs-2"></i>
                </div>

                <div className="floating-card card-3 shadow">
                  <i className="bi bi-graph-up-arrow text-warning fs-2"></i>
                </div>

                <div className="main-circle">

                  <div className="main-logo">
                    <Image
                      src="/images/logo.png"
                      alt="Logo"
                      width={120}
                      height={120}
                    />
                  </div>

                </div>

              </div>

            </Col>

          </Row>

        </Container>

      </section>

      <style jsx>{`

        body {
          background: #f4f7fb;
        }

        /* LOADING */
        .loading-screen {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #0f172a, #1e3a8a);
        }

        /* HERO */
        .hero-section {
          min-height: 100vh;
          background: linear-gradient(
            135deg,
            #0f172a,
            #1e3a8a,
            #2563eb
          );
          overflow: hidden;
          position: relative;
          padding: 2rem;
          padding-top: 8rem;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          width: 550px;
          height: 550px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
          top: -200px;
          right: -150px;
        }

        /* NAVBAR */
        .panel-top-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem 2rem;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          width: 100%;
        }

        .panel-left-section {
          display: flex;
          align-items: center;
          flex-shrink: 0;
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
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .panel-right-section {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-shrink: 0;
        }

        /* BOTONES */
        .action-buttons-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dashboard-btn {
          padding: 12px 26px;
          border-radius: 16px;
          border: none !important;
          background: rgba(255,255,255,0.12) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          gap: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
          white-space: nowrap;
        }

        .dashboard-btn:hover {
          background: #2563eb !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37,99,235,0.4);
        }

        .logout-btn {
          padding: 12px 26px;
          border-radius: 16px;
          border: none !important;
          background: rgba(255,255,255,0.12) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          gap: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
          white-space: nowrap;
        }

        .logout-btn:hover {
          background: #dc2626 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(220,38,38,0.4);
        }

        /* PERFIL */
        .mini-admin-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px 8px 12px;
          background: rgba(255,255,255,0.1);
          border-radius: 50px;
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
        }

        .mini-admin-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.3rem;
        }

        .mini-admin-info h6 {
          margin: 0;
          color: white;
          font-size: 14px;
          font-weight: 700;
        }

        .mini-admin-info p {
          margin: 0;
          font-size: 11px;
          color: rgba(255,255,255,0.7);
        }

        /* CARDS */
        .quick-access-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .quick-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: 0.3s ease;
        }

        .quick-card:hover {
          transform: translateY(-8px);
          background: rgba(255,255,255,0.14);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .quick-icon {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.8rem;
          flex-shrink: 0;
        }

        .quick-card h5 {
          margin: 0;
          font-weight: 700;
          color: white;
        }

        .quick-card p {
          margin: 0;
          color: rgba(255,255,255,0.7);
          font-size: 14px;
        }

        /* HERO IMAGE */
        .hero-image-container {
          position: relative;
          height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .main-circle {
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 25px 60px rgba(0,0,0,0.35);
        }

        .main-logo {
          width: 185px;
          height: 185px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .floating-card {
          position: absolute;
          width: 90px;
          height: 90px;
          background: white;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: float 4s ease-in-out infinite;
        }

        .card-1 {
          top: 20px;
          left: 40px;
        }

        .card-2 {
          bottom: 20px;
          left: 20px;
          animation-delay: 1s;
        }

        .card-3 {
          right: 40px;
          top: 80px;
          animation-delay: 2s;
        }

        @keyframes float {

          0% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-15px);
          }

          100% {
            transform: translateY(0px);
          }
        }

        /* COLORES */
        .bg-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }

        .bg-success {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .bg-info {
          background: linear-gradient(135deg, #06b6d4, #0891b2);
        }

        .bg-secondary {
          background: linear-gradient(135deg, #6b7280, #4b5563);
        }

        .bg-warning {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        /* RESPONSIVE */
        @media (max-width: 992px) {

          .hero-section {
            padding: 1.5rem;
            padding-top: 10rem;
            text-align: center;
          }

          .panel-top-section {
            flex-direction: column;
            gap: 15px;
            padding: 1rem;
          }

          .panel-right-section {
            flex-wrap: wrap;
            justify-content: center;
            width: 100%;
          }

          .quick-access-grid {
            grid-template-columns: 1fr;
          }

          .hero-image-container {
            margin-top: 4rem;
            height: 300px;
          }

          .main-circle {
            width: 180px;
            height: 180px;
          }

          .main-logo {
            width: 130px;
            height: 130px;
          }

          .floating-card {
            width: 70px;
            height: 70px;
          }
        }

        @media (max-width: 768px) {

          .display-3 {
            font-size: 2rem;
          }

          .panel-right-section {
            flex-direction: column;
            align-items: stretch;
          }

          .action-buttons-group {
            width: 100%;
            flex-direction: column;
          }

          .dashboard-btn,
          .logout-btn {
            width: 100%;
          }

          .mini-admin-card {
            width: 100%;
            justify-content: center;
          }
        }

      `}</style>
    </>
  );
}