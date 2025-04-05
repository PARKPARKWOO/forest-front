import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { applyProgram } from '../../services/programService';

export default function ApplyProgramModal({ programId, onClose }) {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    depositor: '',
    file: null,
  });
  const [fileName, setFileName] = useState('');

  const { mutate: submitApplication, isPending } = useMutation({
    mutationFn: (data) => applyProgram({ ...data, programId }),
    onSuccess: () => {
      alert('프로그램 신청이 완료되었습니다.');
      onClose();
    },
    onError: (error) => {
      alert('신청 중 오류가 발생했습니다: ' + error.message);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setFileName(file.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitApplication(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">프로그램 신청</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연락처
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="010-0000-0000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              입금자명
            </label>
            <input
              type="text"
              value={formData.depositor}
              onChange={(e) => setFormData(prev => ({ ...prev, depositor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              입금확인서 (선택)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-gray-300 rounded-md p-3 cursor-pointer hover:border-green-500"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="text-sm text-gray-600">
                {fileName || '파일을 선택하세요'}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                transition-colors duration-200 disabled:bg-gray-400"
            >
              {isPending ? '신청 중...' : '신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 