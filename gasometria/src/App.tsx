/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export function App() {
  const [status, setStatus] = useState<string>('Verificando conexão...')
  const [details, setDetails] = useState<string>('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    checkSupabase()
  }, [])

  async function checkSupabase() {
    try {
      // Tentamos buscar de uma tabela qualquer para testar a comunicação
      // Usamos .limit(0) para não baixar dados, apenas testar o handshake
      const { error } = await supabase.from('test_connection').select('*').limit(0)

      if (error) {
        // Erro PGRST116 ou 404 significa que o Supabase respondeu, 
        // mas a tabela não existe (Isso prova que a CONEXÃO funciona!)
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
          setStatus('✅ Conectado com sucesso!')
          setDetails('O projeto comunicou com o Supabase. Agora você já pode criar suas tabelas reais.')
        } else {
          setStatus('❌ Erro na API')
          setDetails(`O Supabase respondeu, mas com erro: ${error.message}`)
        }
      } else {
        setStatus('✅ Conectado e Tabela encontrada!')
        setDetails('A conexão está 100% operacional.')
      }
    } catch (err) {
      setStatus('❌ Falha Crítica')
      setDetails('Não foi possível contactar o servidor. Verifique sua internet ou a URL no .env.local')
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f4f4f9',
      color: '#333'
    }}>
      <div style={{ 
        padding: '2rem', 
        borderRadius: '12px', 
        backgroundColor: '#fff', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Status do Supabase</h1>
        <p style={{ 
          fontWeight: 'bold', 
          fontSize: '1.2rem', 
          color: status.includes('✅') ? '#10b981' : '#ef4444' 
        }}>
          {status}
        </p>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          {details}
        </p>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Testar novamente
        </button>
      </div>
    </div>
  )
}

export default App