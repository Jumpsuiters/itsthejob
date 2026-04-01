export default function Pay() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      padding: '2rem',
    }}>
      <h1 style={{
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        fontWeight: 800,
        color: '#e8e8e8',
        textAlign: 'center',
        maxWidth: '700px',
        lineHeight: 1.3,
      }}>
        Great question.<br />Who&apos;s not already paying for it?
      </h1>
      <a href="/" style={{
        marginTop: '2rem',
        color: '#3dcdb4',
        fontSize: '1rem',
        textDecoration: 'none',
        borderBottom: '1px solid #3dcdb4',
      }}>Back to J.O.B.</a>
    </div>
  );
}
