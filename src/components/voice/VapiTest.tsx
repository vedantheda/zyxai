'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createVapi } from '@/lib/vapiConfig'

export default function VapiTest() {
  const [status, setStatus] = useState('Not started')
  const [micStatus, setMicStatus] = useState('Unknown')

  const testVapiImport = async () => {
    try {
      setStatus('Creating voice AI instance...')
      console.log('🔄 Testing voice AI creation...')

      // Test creating instance
      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
      if (publicKey) {
        const vapi = await createVapi(publicKey)
        console.log('✅ Voice AI instance created:', vapi)
        setStatus('Voice AI instance created successfully!')
      } else {
        setStatus('No voice AI public key found')
      }
    } catch (error) {
      console.error('❌ Voice AI import error:', error)
      setStatus(`Voice AI import failed: ${error}`)
    }
  }

  const testMicrophone = async () => {
    try {
      setMicStatus('Testing...')
      console.log('🎤 Testing microphone...')
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported')
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ Microphone access granted')
      setMicStatus('Access granted')
      
      // Test audio levels
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      let testCount = 0
      const maxTests = 25
      
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / bufferLength
        
        console.log(`🔊 Audio level: ${average.toFixed(2)}`)
        
        if (average > 5) {
          setMicStatus(`Working! Level: ${average.toFixed(1)}`)
          console.log('✅ Audio input detected!')
          // Cleanup
          stream.getTracks().forEach(track => track.stop())
          audioContext.close()
          return
        }
        
        if (testCount < maxTests) {
          testCount++
          setTimeout(checkAudio, 100)
        } else {
          setMicStatus('No audio detected - try speaking')
          console.log('⚠️ No audio input detected')
          // Cleanup
          stream.getTracks().forEach(track => track.stop())
          audioContext.close()
        }
      }
      
      checkAudio()
      
    } catch (error: any) {
      console.error('❌ Microphone test failed:', error)
      if (error.name === 'NotAllowedError') {
        setMicStatus('Permission denied')
      } else {
        setMicStatus(`Error: ${error.message}`)
      }
    }
  }

  useEffect(() => {
    // Auto-test on mount
    setTimeout(() => {
      console.log('🚀 Auto-testing VAPI and microphone...')
      testVapiImport()
      testMicrophone()
    }, 1000)
  }, [])

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Voice AI & Microphone Test</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Voice AI Status:</h3>
          <p className="text-sm text-gray-600">{status}</p>
          <Button onClick={testVapiImport} className="mt-2" size="sm">
            Test Voice AI Import
          </Button>
        </div>
        
        <div>
          <h3 className="font-semibold">Microphone Status:</h3>
          <p className="text-sm text-gray-600">{micStatus}</p>
          <Button onClick={testMicrophone} className="mt-2" size="sm">
            Test Microphone
          </Button>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>Check browser console for detailed logs</p>
        </div>
      </div>
    </div>
  )
}
