'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        const userRole = data.user.role;
        
        if (userRole === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (userRole === 'WORKER') {
          router.push('/worker/dashboard');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (error) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
              {/* Header con gradiente */}
              <div className="bg-gradient-primary text-white text-center py-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Image 
                  src="/images/logo.png" 
                  alt="Stocky Logo" 
                  width={70} 
                  height={70}
                  style={{ objectFit: 'contain' }}
                  className="bg-white rounded-circle p-2"
                />
                <h3 className="mt-3 mb-0 fw-bold">Stocky Farmacia</h3>
                <p className="opacity-75 small mb-0">Sistema de gestión de inventario</p>
              </div>
              
              <Card.Body className="p-5">
                <h4 className="text-center mb-4 fw-semibold">Iniciar Sesión</h4>
                
                {error && <Alert variant="danger" className="rounded-pill">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-person me-2"></i>Usuario o Correo
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre de usuario o correo@ejemplo.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="py-2 rounded-pill"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-lock me-2"></i>Contraseña
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="py-2 rounded-pill"
                      required
                    />
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 py-2 rounded-pill fw-semibold"
                    disabled={loading}
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                  >
                    {loading ? <Spinner animation="border" size="sm" /> : 'Iniciar Sesión'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <Link href="/signup" className="text-decoration-none small">
                    ¿No tienes cuenta? Regístrate
                  </Link>
                  <br />
                  <Link href="/" className="text-decoration-none small">
                    ← Volver a la tienda
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}