'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const router = useRouter();

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        if (value.length < 3) return 'El nombre debe tener al menos 3 caracteres';
        if (value.length > 100) return 'El nombre no puede tener más de 100 caracteres';
        return '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Ingresa un correo electrónico válido';
        return '';
      case 'password':
        if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
        if (value.length > 50) return 'La contraseña no puede tener más de 50 caracteres';
        return '';
      case 'confirmPassword':
        if (value !== formData.password) return 'Las contraseñas no coinciden';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    const fieldError = validateField(name, value);
    setErrors({ ...errors, [name]: fieldError });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos
    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword)
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(err => err !== '')) {
      setError('Por favor, corrige los errores del formulario');
      return;
    }
    
    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'Administrador creado exitosamente. Ahora puedes iniciar sesión.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="bg-gradient-primary text-white text-center py-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Image 
                  src="/images/logo.png" 
                  alt="Stocky Logo" 
                  width={65} 
                  height={65}
                  style={{ objectFit: 'contain' }}
                  className="bg-white rounded-circle p-2"
                />
                <h3 className="mt-3 mb-0 fw-bold">Crear cuenta de Administrador</h3>
                <p className="opacity-75 small mb-0">Regístrate para gestionar el sistema</p>
              </div>
              
              <Card.Body className="p-5">
                <div className="alert alert-info small rounded-pill d-flex align-items-center gap-2 mb-4">
                  <i className="bi bi-info-circle-fill fs-5"></i>
                  <span className="flex-grow-1">Al registrarte, obtendrás acceso como Administrador del sistema.</span>
                </div>
                
                {error && <Alert variant="danger" className="rounded-pill">{error}</Alert>}
                {success && <Alert variant="success" className="rounded-pill">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-person me-2"></i>Nombre completo
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="Ingresa tu nombre"
                      value={formData.name}
                      onChange={handleChange}
                      className={`py-2 rounded-pill ${errors.name ? 'is-invalid' : ''}`}
                      required
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-envelope me-2"></i>Correo electrónico
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`py-2 rounded-pill ${errors.email ? 'is-invalid' : ''}`}
                      required
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-lock me-2"></i>Contraseña
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                      className={`py-2 rounded-pill ${errors.password ? 'is-invalid' : ''}`}
                      required
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-lock-fill me-2"></i>Confirmar contraseña
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`py-2 rounded-pill ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      required
                    />
                    {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      label="Acepto los términos y condiciones"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                    />
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 py-2 rounded-pill fw-semibold"
                    disabled={loading}
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                  >
                    {loading ? <Spinner animation="border" size="sm" /> : 'Registrarse como Administrador'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <Link href="/login" className="text-decoration-none small">
                    ¿Ya tienes cuenta? Inicia sesión
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