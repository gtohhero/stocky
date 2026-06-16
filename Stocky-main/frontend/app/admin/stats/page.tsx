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
  Dropdown,
  DropdownButton
} from 'react-bootstrap';

interface DashboardStats {
  total_products: number;
  total_units: number;
  total_investment: number;
  total_value: number;
  total_potential_profit: number;
  avg_profit_per_unit: number;
  avg_margin: number;
  low_stock_count: number;
}

interface Branch {
  id: number;
  name: string;
  address: string;
}

interface BranchStats {
  branch_id: number;
  branch_name: string;
  total_products: number;
  total_units: number;
  total_investment: number;
  total_value: number;
  total_profit: number;
  low_stock_count: number;
}

export default function AdminStats() {

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [allBranchesStats, setAllBranchesStats] =
    useState<BranchStats[]>([]);

  const [selectedBranch, setSelectedBranch] =
    useState<number | null>(null);

  const [selectedBranchName, setSelectedBranchName] =
    useState<string>('General');

  const [showGeneral, setShowGeneral] =
    useState<boolean>(true);

  const [loading, setLoading] =
    useState(true);

  const [loadingBranches, setLoadingBranches] =
    useState(true);

  const [error, setError] =
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

  useEffect(() => {

    if (showGeneral) {
      fetchGeneralStats();
    } else if (selectedBranch !== null) {
      fetchStatsByBranch();
    }

  }, [selectedBranch, showGeneral]);

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

      const branchesList =
        Array.isArray(data) ? data : [];

      setBranches(branchesList);

      if (
        branchesList.length > 0 &&
        !selectedBranch
      ) {
        setSelectedBranch(branchesList[0].id);
      }

    } catch (error) {

      console.error('Error:', error);
      setBranches([]);

    } finally {

      setLoadingBranches(false);

    }
  };

  const fetchGeneralStats = async () => {

    const token = localStorage.getItem('token');

    setLoading(true);
    setError('');

    try {

      const res = await fetch(
        'http://localhost:5001/api/stats/all',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        throw new Error(
          `HTTP error! status: ${res.status}`
        );
      }

      const data = await res.json();

      setStats({
        total_products:
          Number(data.total_products) || 0,

        total_units:
          Number(data.total_units) || 0,

        total_investment:
          Number(data.total_investment) || 0,

        total_value:
          Number(data.total_value) || 0,

        total_potential_profit:
          Number(data.total_profit) || 0,

        avg_profit_per_unit:
          Number(data.avg_profit_per_unit) || 0,

        avg_margin:
          Number(data.avg_margin) || 0,

        low_stock_count:
          Number(data.low_stock_count) || 0
      });

      await fetchAllBranchesStats();

    } catch (error) {

      console.error(
        'Error fetching general stats:',
        error
      );

      setError(
        'Error al cargar las estadísticas generales'
      );

    } finally {

      setLoading(false);

    }
  };

  const fetchStatsByBranch = async () => {

    if (!selectedBranch) return;

    const token = localStorage.getItem('token');

    setLoading(true);
    setError('');

    try {

      const res = await fetch(
        `http://localhost:5001/api/stats/branch/${selectedBranch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        throw new Error(
          `HTTP error! status: ${res.status}`
        );
      }

      const data = await res.json();

      setStats({
        total_products:
          Number(data.total_products) || 0,

        total_units:
          Number(data.total_units) || 0,

        total_investment:
          Number(data.total_investment) || 0,

        total_value:
          Number(data.total_value) || 0,

        total_potential_profit:
          Number(data.total_profit) || 0,

        avg_profit_per_unit:
          data.total_units
            ? Number(data.total_profit) /
              Number(data.total_units)
            : 0,

        avg_margin:
          data.total_value
            ? (
                Number(data.total_profit) /
                Number(data.total_value)
              ) * 100
            : 0,

        low_stock_count:
          Number(data.low_stock_count) || 0
      });

    } catch (error) {

      console.error(
        'Error fetching branch stats:',
        error
      );

      setError(
        'Error al cargar las estadísticas de la sucursal'
      );

    } finally {

      setLoading(false);

    }
  };

  const fetchAllBranchesStats = async () => {

    const token = localStorage.getItem('token');

    const branchStatsList: BranchStats[] = [];

    for (const branch of branches) {

      try {

        const res = await fetch(
          `http://localhost:5001/api/stats/branch/${branch.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await res.json();

        branchStatsList.push({
          branch_id: branch.id,
          branch_name: branch.name,
          total_products:
            Number(data.total_products) || 0,
          total_units:
            Number(data.total_units) || 0,
          total_investment:
            Number(data.total_investment) || 0,
          total_value:
            Number(data.total_value) || 0,
          total_profit:
            Number(data.total_profit) || 0,
          low_stock_count:
            Number(data.low_stock_count) || 0
        });

      } catch (error) {

        console.error(
          `Error fetching stats for branch ${branch.id}:`,
          error
        );

      }
    }

    setAllBranchesStats(branchStatsList);
  };

  const handleSelectBranch = (
    branchId: number,
    branchName: string
  ) => {

    setShowGeneral(false);
    setSelectedBranch(branchId);
    setSelectedBranchName(branchName);

  };

  const handleSelectGeneral = () => {

    setShowGeneral(true);
    setSelectedBranchName('General');

  };

  const handleLogout = () => {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    router.push('/login');

  };

  if (loadingBranches) {

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
              <i className="bi bi-bar-chart-line me-2"></i>
              Estadísticas
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
                Estadísticas Generales
              </h1>

              <p className="hero-subtitle">
                Analiza ganancias, inventario,
                rendimiento y comparativas entre
                sucursales.
              </p>

            </div>

<div className="d-flex align-items-center gap-3">

  <DropdownButton
    title={
      <>
        <i className="bi bi-building me-2"></i>

        {showGeneral
          ? 'General'
          : selectedBranchName}
      </>
    }
    variant="light"
    className="branch-selector"
  >

    <Dropdown.Item
      onClick={handleSelectGeneral}
    >
      <i className="bi bi-bar-chart me-2"></i>
      General
    </Dropdown.Item>

    <Dropdown.Divider />

    {branches.map((branch) => (

      <Dropdown.Item
        key={branch.id}
        active={
          !showGeneral &&
          selectedBranch === branch.id
        }
        onClick={() =>
          handleSelectBranch(
            branch.id,
            branch.name
          )
        }
      >
        <i className="bi bi-building me-2"></i>
        {branch.name}
      </Dropdown.Item>

    ))}

  </DropdownButton>

  <div className="hero-icon-wrapper">
    <i className="bi bi-graph-up-arrow"></i>
  </div>

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

          {/* LOADING */}
          {loading ? (

            <div className="loading-content">
              <Spinner
                animation="border"
                variant="light"
              />

              <p className="mt-3 text-white">
                Cargando estadísticas...
              </p>
            </div>

          ) : stats ? (
            <>

              {/* STATS */}
              <Row className="g-4 mb-4">

                <Col lg={3} md={6}>
                  <div className="stats-card">

                    <div>
                      <p>Productos</p>
                      <h3>{stats.total_products}</h3>
                    </div>

                    <i className="bi bi-box-seam"></i>

                  </div>
                </Col>

                <Col lg={3} md={6}>
                  <div className="stats-card">

                    <div>
                      <p>Inventario</p>

                      <h3>
                        $
                        {stats.total_value?.toLocaleString()}
                      </h3>
                    </div>

                    <i className="bi bi-cash-stack"></i>

                  </div>
                </Col>

                <Col lg={3} md={6}>
                  <div className="stats-card">

                    <div>
                      <p>Ganancia</p>

                      <h3 className="text-success">
                        $
                        {stats.total_potential_profit?.toLocaleString()}
                      </h3>
                    </div>

                    <i className="bi bi-graph-up"></i>

                  </div>
                </Col>

                <Col lg={3} md={6}>
                  <div className="stats-card">

                    <div>
                      <p>Stock Bajo</p>

                      <h3 className="text-warning">
                        {stats.low_stock_count}
                      </h3>
                    </div>

                    <i className="bi bi-exclamation-triangle"></i>

                  </div>
                </Col>

              </Row>

              {/* MÉTRICAS */}
              <Row className="g-4 mb-4">

                <Col lg={6}>
                  <Card className="glass-card border-0 h-100">

                    <Card.Body className="p-4">

                      <h5 className="fw-bold mb-4 text-dark">
                        <i className="bi bi-speedometer2 me-2 text-primary"></i>
                        Métricas Clave
                      </h5>

                      <Row className="g-3">

                        <Col sm={6}>
                          <div className="detail-stat-card">

                            <small>
                              Unidades Totales
                            </small>

                            <h5 className="text-info">
                              {stats.total_units?.toLocaleString()}
                            </h5>

                          </div>
                        </Col>

                        <Col sm={6}>
                          <div className="detail-stat-card">

                            <small>
                              Margen Promedio
                            </small>

                            <h5 className="text-primary">
                              {stats.avg_margin?.toFixed(
                                1
                              )}
                              %
                            </h5>

                          </div>
                        </Col>

                        <Col sm={6}>
                          <div className="detail-stat-card">

                            <small>
                              Ganancia por Unidad
                            </small>

                            <h5 className="text-success">
                              $
                              {stats.avg_profit_per_unit?.toFixed(
                                2
                              )}
                            </h5>

                          </div>
                        </Col>

                        <Col sm={6}>
                          <div className="detail-stat-card">

                            <small>
                              ROI Estimado
                            </small>

                            <h5 className="text-warning">
                              {stats.total_investment
                                ? Math.round(
                                    (
                                      stats.total_potential_profit /
                                      stats.total_investment
                                    ) * 100
                                  )
                                : 0}
                              %
                            </h5>

                          </div>
                        </Col>

                      </Row>

                    </Card.Body>

                  </Card>
                </Col>

                <Col lg={6}>
                  <Card className="glass-card border-0 h-100">

                    <Card.Body className="p-4">

                      <h5 className="fw-bold mb-4 text-dark">
                        <i className="bi bi-pie-chart me-2 text-success"></i>
                        Resumen
                      </h5>

                      <div className="summary-grid">

                        <div className="summary-item">
                          <i className="bi bi-box"></i>
                          <h5>{stats.total_products}</h5>
                          <small>Productos</small>
                        </div>

                        <div className="summary-item">
                          <i className="bi bi-currency-dollar"></i>
                          <h5>
                            $
                            {stats.total_potential_profit?.toLocaleString()}
                          </h5>
                          <small>Ganancia</small>
                        </div>

                        <div className="summary-item">
                          <i className="bi bi-exclamation-circle"></i>
                          <h5>
                            {stats.low_stock_count}
                          </h5>
                          <small>Alertas</small>
                        </div>

                      </div>

                    </Card.Body>

                  </Card>
                </Col>

              </Row>

              {/* TABLA */}
              {showGeneral &&
                allBranchesStats.length > 0 && (

                <Card className="glass-card border-0 overflow-hidden">

                  <div className="p-4 border-bottom">

                    <h5 className="fw-bold text-dark mb-0">
                      <i className="bi bi-table me-2 text-primary"></i>
                      Comparativa por Sucursal
                    </h5>

                  </div>

                  <div className="table-responsive">

                    <Table className="table-custom mb-0 align-middle">

                      <thead>

                        <tr>
                          <th>Sucursal</th>
                          <th className="text-end">
                            Productos
                          </th>
                          <th className="text-end">
                            Unidades
                          </th>
                          <th className="text-end">
                            Inventario
                          </th>
                          <th className="text-end">
                            Ganancia
                          </th>
                          <th className="text-end">
                            Alertas
                          </th>
                        </tr>

                      </thead>

                      <tbody>

                        {allBranchesStats.map(
                          (branchStat) => (

                            <tr
                              key={
                                branchStat.branch_id
                              }
                              className="branch-row"
                              onClick={() =>
                                handleSelectBranch(
                                  branchStat.branch_id,
                                  branchStat.branch_name
                                )
                              }
                            >

                              <td className="fw-semibold">
                                <i className="bi bi-building me-2 text-primary"></i>

                                {
                                  branchStat.branch_name
                                }
                              </td>

                              <td className="text-end">
                                {
                                  branchStat.total_products
                                }
                              </td>

                              <td className="text-end">
                                {branchStat.total_units?.toLocaleString()}
                              </td>

                              <td className="text-end fw-bold text-primary">
                                $
                                {branchStat.total_value?.toLocaleString()}
                              </td>

                              <td className="text-end fw-bold text-success">
                                $
                                {branchStat.total_profit?.toLocaleString()}
                              </td>

                              <td className="text-end">

                                <Badge
                                  bg={
                                    branchStat.low_stock_count >
                                    0
                                      ? 'warning'
                                      : 'success'
                                  }
                                  text={
                                    branchStat.low_stock_count >
                                    0
                                      ? 'dark'
                                      : 'light'
                                  }
                                >
                                  {
                                    branchStat.low_stock_count
                                  }
                                </Badge>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </Table>

                  </div>

                </Card>

              )}

            </>
          ) : (

            <Card className="glass-card border-0 text-center p-5">

              <Card.Body>

                <i className="bi bi-database fs-1 text-muted"></i>

                <p className="text-muted mt-3">
                  No hay datos disponibles
                </p>

                <Button
                  variant="primary"
                  onClick={() =>
                    router.push('/admin/products')
                  }
                >
                  Gestionar productos
                </Button>

              </Card.Body>

            </Card>

          )}

        </Container>

      </div>

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

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
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
          flex-wrap: wrap;
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

        .branch-selector :global(.dropdown-toggle) {
          border: none !important;
          background: rgba(255,255,255,0.12) !important;
          color: white !important;
          border-radius: 16px !important;
          padding: 12px 20px !important;
          font-weight: 600;
          backdrop-filter: blur(10px);
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

/* AGREGA SOLO ESTO EN TU STYLE JSX */

/* HERO */
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

  /* NUEVO */
  position: relative;
  overflow: visible;
  z-index: 5;
}

/* SELECTOR */
.branch-selector {
  position: relative;
  z-index: 9999;
}

.branch-selector :global(.dropdown-menu) {
  z-index: 99999 !important;
  border-radius: 18px;
  border: none;
  overflow: hidden;
  margin-top: 10px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.25);
}

.branch-selector :global(.dropdown-item) {
  padding: 12px 18px;
  font-weight: 500;
}

.branch-selector :global(.dropdown-item:hover) {
  background: #2563eb;
  color: white;
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
          vertical-align: middle;
          border-color: #e2e8f0;
        }

        .branch-row {
          transition: 0.3s;
          cursor: pointer;
        }

        .branch-row:hover {
          background: #f1f5f9;
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

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 1rem;
        }

        .summary-item {
          background: #f8fafc;
          border-radius: 20px;
          padding: 1.5rem;
          text-align: center;
          transition: 0.3s;
        }

        .summary-item:hover {
          transform: translateY(-5px);
        }

        .summary-item i {
          font-size: 2rem;
          color: #2563eb;
          margin-bottom: 10px;
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

          .summary-grid {
            grid-template-columns: 1fr;
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
        }

      `}</style>
    </>
  );
} 