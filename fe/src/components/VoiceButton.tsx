import React, { useState, useRef, useEffect } from 'react';
import { Button, message, Modal } from 'antd';
import { AudioOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionError, SpeechRecognitionResult } from '../types/speech';
const VoiceButtonContainer = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
`;

const TranscriptionText = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 16px;
  line-height: 1.5;
`;

interface VoiceButtonProps {
  onVoiceData: (audioBlob: Blob, transcription?: string) => void;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ onVoiceData }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Kiểm tra trình duyệt có hỗ trợ Web Speech API không
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'vi-VN'; // Ngôn ngữ tiếng Việt

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results as SpeechRecognitionResultList)
          .map((result: SpeechRecognitionResult) => result[0].transcript)
          .join('');
        
        setTranscription(transcript);
        console.log('Nhận dạng giọng nói:', transcript);
      };

      recognition.onerror = (event: SpeechRecognitionError) => {
        console.error('Lỗi nhận dạng giọng nói:', event.error);
        message.error('Có lỗi xảy ra khi nhận dạng giọng nói');
      };

      recognition.onend = () => {
        if (isRecording) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    } else {
      message.error('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (!base64Audio) return;

        // Call your backend API for transcription
        const response = await fetch('YOUR_BACKEND_API/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio: base64Audio,
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'vi-VN', // Vietnamese
          }),
        });

        const data = await response.json();
        if (data.transcription) {
          setTranscription(data.transcription);
          setShowTranscription(true);
          onVoiceData(audioBlob, data.transcription);
        }
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      message.error('Không thể chuyển đổi giọng nói thành văn bản');
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
        setTranscription('');
        message.success('Bắt đầu nhận dạng giọng nói');
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      message.error('Không thể bắt đầu nhận dạng giọng nói');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      message.success('Đã dừng nhận dạng giọng nói');
      console.log('Kết quả cuối cùng:', transcription);
    }
  };

  return (
    <>
      <VoiceButtonContainer>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={isRecording ? <LoadingOutlined /> : <AudioOutlined />}
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            width: '64px',
            height: '64px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backgroundColor: isRecording ? '#ff4d4f' : '#1890ff'
          }}
        />
      </VoiceButtonContainer>

      <Modal
        title="Kết quả chuyển đổi giọng nói"
        open={showTranscription}
        onOk={() => setShowTranscription(false)}
        onCancel={() => setShowTranscription(false)}
        confirmLoading={isTranscribing}
      >
        {isTranscribing ? (
          <div>Đang chuyển đổi giọng nói thành văn bản...</div>
        ) : (
          <TranscriptionText>{transcription}</TranscriptionText>
        )}
      </Modal>
    </>
  );
};

export default VoiceButton; 