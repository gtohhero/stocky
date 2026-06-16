'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Card, Button, Navbar, Nav } from 'react-bootstrap';

export default function LandingPage() {
  return (
    <>
      {/* Navbar */}
      <Navbar bg="white" expand="lg" className="shadow-sm px-4 py-3">
        <Container>
          <Navbar.Brand href="/" className="d-flex align-items-center gap-2">
            <Image 
              src="/images/logo.png" 
              alt="Stocky Logo" 
              width={35} 
              height={35}
              style={{ objectFit: 'contain' }}
            />
            <span className="fw-bold text-primary fs-4">Stocky Farmacia</span>
          </Navbar.Brand>
          <Navbar.Toggle />

        </Container>
      </Navbar>

      {/* Hero Section */}
      <div className="bg-gradient-primary text-white py-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container className="text-center py-5">
          <h1 className="display-3 fw-bold mb-3">Stocky Farmacia</h1>
          <p className="lead mb-4">Tu salud es nuestra prioridad. Gestiona tu farmacia de manera inteligente.</p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link href="/login" className="btn btn-light btn-lg px-4">
              <i className="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión
            </Link>
            <Link href="/usuario" className="btn btn-outline-light btn-lg px-4">
              <i className="bi bi-person-plus me-2"></i>Catalogo
            </Link>
          </div>
        </Container>
      </div>

      {/* Características */}
      <Container className="py-5">
 
      </Container>

  

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container className="text-center">
          <p className="mb-0 small">&copy; 2024 Stocky Farmacia. Todos los derechos reservados.</p>
          <p className="text-muted small mt-1">Tu salud, nuestra prioridad</p>
        </Container>
      </footer>

      <style jsx>{`
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
    </>
  );
}