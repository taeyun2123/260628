"use client";

import React, { useState, useEffect } from "react";

const termsContent = `
# 이용약관

## 제1조 (목적)
본 약관은 김태연 교사(이하 "개발자")가 개발 및 제공하는 교육용 도구인 '랜덤 발표자 추출' 앱(이하 "서비스")의 이용과 관련하여, 개발자와 이용자(교사, 학생 등) 간의 권리와 의무, 책임 사항 및 기타 필요한 제반 사항을 규정함을 목적으로 합니다.

## 제2조 (서비스의 성격 및 제공)
1. 본 서비스는 학교 수업 및 학급 운영의 편의를 돕기 위해 무상으로 제공되는 공익적 교육 도구입니다.
2. 본 서비스는 오프라인 기반으로 작동하며(설치 후 브라우저 내 동작), 사용자가 입력한 모든 데이터는 기기(Local Storage)에만 보관될 뿐, 어떠한 외부 데이터베이스 서버로도 전송되거나 수집되지 않습니다.

## 제3조 (이용자의 의무)
1. 이용자는 서비스를 활용함에 있어 타인에게 불쾌감을 주거나 명예를 훼손할 수 있는 부적절한 단어, 욕설, 닉네임 등을 입력하여 사용해서는 안 됩니다.
2. 공용 PC(교실 PC, 도서관 PC 등)에서 본 서비스를 이용한 경우, 사용 후에는 개인정보 보호를 위해 화면 내 삭제 기능을 통해 입력했던 명단 데이터를 스스로 파기할 의무가 있습니다.
3. 이용자는 교육 목적으로 제공되는 본 서비스의 본래 목적에 어긋나는 상업적 활용을 할 수 없습니다.

## 제4조 (개발자의 권리와 의무)
1. 개발자는 교육적 목적에 부합하도록 안정적이고 지속적인 서비스 제공을 위해 노력합니다.
2. 개발자는 사용자의 어떠한 데이터도 무단으로 외부로 수집하거나 제3자에게 제공하지 않습니다.

## 제5조 (면책 조항)
1. 본 서비스는 무료로 배포되는 교육 도구이므로, 사용 중 예기치 못한 브라우저 오류, 기기 결함, 혹은 사용자의 브라우저 캐시 삭제 등으로 인해 발생한 데이터(학생 명단 등) 손실에 대해 개발자는 어떠한 법적 책임도 지지 않습니다.
2. 이용자가 본 서비스에 입력한 개인정보(이름 등)의 관리 소홀 또는 제3자 노출로 인해 발생하는 문제의 책임은 전적으로 이용자 본인에게 있습니다.
3. 서비스 내 포함된 'AI 윤리 핵심가이드' 등은 교육적 목적으로 제공되는 가이드라인이며, 이를 이행하지 않아 발생하는 학습태도 및 윤리적 책임에 대해 개발자가 책임지지 않습니다.

## 제6조 (저작권 및 지적재산권)
1. 서비스가 제공하는 UI/UX, 디자인, 코드 및 텍스트 등에 대한 저작권 및 지적재산권은 원칙적으로 개발자에게 있습니다.
2. 이용자는 개발자의 사전 승낙 없이 서비스의 내용이나 디자인을 무단 복제, 배포, 수정, 상업적 이용할 수 없습니다.

## 제7조 (약관의 변경)
개발자는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있으며, 개정된 약관은 서비스 화면 또는 웹페이지를 통해 공지함으로써 효력이 발생합니다.

- **부칙**: 본 약관은 서비스 공지일부터 시행됩니다.
`;

const privacyContent = `
# 개인정보처리방침

'랜덤 발표자 추출' 앱(이하 '본 서비스')은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.

> **중요 안내사항**: 본 서비스는 **별도의 데이터베이스 서버를 운영하지 않으며, 회원가입 절차가 없습니다.** 입력된 모든 데이터는 전적으로 사용자의 기기(브라우저의 Local Storage)에만 저장되어 외부로 전송되거나 수집되지 않습니다.

## 제1조 (개인정보의 처리 목적)
본 서비스는 다음의 목적을 위하여 개인정보를 취급합니다. 취급하는 개인정보는 사용자의 로컬 기기에만 저장되며, 다음 목적 이외의 용도로는 이용되지 않습니다.
- **학생 명단 관리**: 수업 중 무작위 발표자 선정 및 학급 구성원 식별

## 제2조 (개인정보의 처리 및 보유기간)
① 본 서비스는 입력 데이터를 외부 서버로 수집하거나 전송하지 않으며, 사용자가 입력한 데이터는 전적으로 사용자의 기기 내 브라우저 로컬 스토리지에 보관됩니다.
② **보유 및 파기**: 사용자가 서비스 내에서 직접 [명단 초기화]를 하거나, 브라우저 캐시 및 인터넷 사용 기록을 삭제할 때 데이터는 해당 기기에서 지체 없이 영구 파기됩니다.

## 제3조 (처리하는 개인정보 항목)
본 서비스는 학습 지원 및 기능 구현을 위해 필요한 최소한의 정보만을 취급합니다.
- **취급 항목**: 학생 이름 (또는 닉네임)
- **수집하지 않는 항목**: 주민등록번호, 주소, 전화번호, 이메일 등 불필요한 민감 정보

## 제4조 (만 14세 미만 아동의 개인정보 처리에 관한 사항)
본 서비스는 서버 단위의 정보 수집 및 회원가입이 없으므로 법정대리인의 동의 절차를 별도로 요구하지 않습니다. 단, 교사가 학급 운영 목적으로 활용 시 각 학교의 내부 방침을 따릅니다.

## 제5조 (개인정보의 파기 절차 및 방법)
개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 서비스 화면의 삭제 버튼을 클릭하거나 브라우저 스토리지를 비움으로써 기록을 재생할 수 없도록 파기(영구 삭제)할 수 있습니다.

## 제6조 (개인정보의 안전성 확보조치)
본 서비스는 외부 서버 통신 기능이 없으므로 네트워크 해킹을 통한 개인정보 유출 위험이 없습니다. 
다만, 사용자는 **공용 PC 등에서 서비스를 이용한 후에는 반드시 학생 명단을 초기화하여 타인에게 정보가 노출되지 않도록 직접 관리**해야 할 책임이 있습니다.

## 제7조 (개인정보 보호책임자)
본 서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 이와 관련한 고충을 신속하게 처리하기 위하여 아래와 같이 책임자를 지정하고 있습니다.
- **성명**: 김태연 (개발자)
- **소속**: 성남중
- **직위**: 교사
- **연락처**: 815-1332 (※ 교사의 개인 휴대전화 번호는 기재하지 않습니다.)

## 제8조 (개인정보 처리방침 변경)
이 개인정보 처리방침은 서비스 공지일부터 적용됩니다.
`;

export default function GlobalFooter() {
  const [modalType, setModalType] = useState<"TERMS" | "PRIVACY" | "AGREEMENT" | null>(null);

  useEffect(() => {
    // 최초 접속 시 약관 동의 팝업 띄우기
    const isAccepted = localStorage.getItem("terms_accepted");
    if (!isAccepted) {
      setModalType("AGREEMENT");
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("terms_accepted", "true");
    setModalType(null);
  };

  const formatMarkdownToReact = (text: string) => {
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("# ")) {
        return <h1 key={idx} className="mt-4 mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">{line.replace("# ", "")}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={idx} className="mt-4 mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("> ")) {
        return <blockquote key={idx} className="my-2 border-l-4 border-olive-500 bg-beige-50 p-3 text-sm text-gray-700 dark:bg-zinc-800 dark:text-gray-300 dark:border-olive-600">{line.replace("> ", "")}</blockquote>;
      }
      if (line.trim() === "") {
        return <br key={idx} />;
      }
      return <p key={idx} className="mb-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{line}</p>;
    });
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs font-medium text-gray-400 z-40 bg-white/70 dark:bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm ring-1 ring-black/5">
        <button onClick={() => setModalType("TERMS")} className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          이용약관
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button onClick={() => setModalType("PRIVACY")} className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          개인정보처리방침
        </button>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setModalType(null)} />
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900">
            {/* Header */}
            <div className="flex-none items-center justify-between border-b border-gray-100 p-5 dark:border-zinc-800 flex">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {modalType === "TERMS" ? "이용약관" : modalType === "PRIVACY" ? "개인정보처리방침" : "서비스 이용 동의"}
              </h2>
              {modalType !== "AGREEMENT" && (
                <button
                  onClick={() => setModalType(null)}
                  className="rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {modalType === "PRIVACY" 
                ? formatMarkdownToReact(privacyContent) 
                : formatMarkdownToReact(termsContent)}
              {modalType === "AGREEMENT" && (
                <div className="mt-8 border-t border-gray-200 pt-8 dark:border-zinc-700">
                  {formatMarkdownToReact(privacyContent)}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-none border-t border-gray-100 bg-gray-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
              <button
                onClick={modalType === "AGREEMENT" ? handleAccept : () => setModalType(null)}
                className="w-full max-w-[300px] rounded-2xl bg-[#1ab08e] px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#159678] active:scale-95 dark:bg-[#159678] dark:hover:bg-[#1ab08e]"
              >
                {modalType === "AGREEMENT" ? "동의하고 시작하기" : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
