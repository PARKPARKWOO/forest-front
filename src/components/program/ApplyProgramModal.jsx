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
  const [agreements, setAgreements] = useState({
    imageAgreement: false,
    privacyAgreement: false,
  });

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
    if (!agreements.imageAgreement || !agreements.privacyAgreement) {
      alert('모든 동의 항목에 체크해주세요.');
      return;
    }
    submitApplication(formData);
  };

  const isFormValid = agreements.imageAgreement && agreements.privacyAgreement;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">프로그램 신청</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 입력 */}
          <div className="space-y-4">
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
          </div>

          {/* 동의 항목 */}
          <div className="space-y-6 border-t pt-6">
            {/* 초상권 동의 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">촬영 및 초상권 활용 동의서</h3>
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p>전북생명의숲에서 주최하는 프로그램 및 행사에 참여하는 본인 또는 영유아의 법정대리인에게 초상권 사용 동의를 받고자 합니다.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>수집 목적 : 결과보고 및 홍보에 활용.</li>
                  <li>수집 항목 : 프로그램 및 행사 활동 사진 및 동영상</li>
                  <li>활용 범위 : 전북생명의숲 SNS와 유튜브 게시, 사업 결과보고서 사용, 홈페이지 게시</li>
                </ul>
                <p className="text-red-600">※ 동의 거부시에는 프로그램 및 행사에 참여하실 수 없습니다.</p>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={agreements.imageAgreement}
                  onChange={(e) => setAgreements(prev => ({ ...prev, imageAgreement: e.target.checked }))}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium">촬영 및 초상권 활용에 동의합니다.</span>
              </label>
            </div>

            {/* 개인정보 동의 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">개인정보의 수집 및 이용 목적</h3>
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p>전북생명의숲은 이용자의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호"에 관한 법률을 준수하고 있습니다.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>개인정보 수집.이용 목적 - 프로그램 참가신청, 신청자 및 일정 관리</li>
                  <li>개인정보 수집 항목 - 대상, 신청자명, 연락처, 입금자명</li>
                  <li>개인정보 제3자제공 리스트 : 전북특별자치도도청, 전주시청, 전북특별자치도교육청, 생명의숲본부, 국가기관의 법적 권한과 효력에 의해 제공이 요구될 때</li>
                  <li>보유.이용기간 - 프로그램 종료 및 수료증 발급과 관련 없을시까지 보유.</li>
                </ul>
                <p className="text-red-600">※ 개인정보 수집.이용 미동의시 교육 참가 대상에서 제외 될 수 있습니다.</p>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={agreements.privacyAgreement}
                  onChange={(e) => setAgreements(prev => ({ ...prev, privacyAgreement: e.target.checked }))}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium">개인정보 수집 및 제3자정보 제공에 동의합니다.</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isPending || !isFormValid}
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