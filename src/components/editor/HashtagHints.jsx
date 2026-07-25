import { useMemo } from 'react';
import { extractHashtags } from '../../utils/hashtag';

/**
 * 본문에서 인식된 해시태그를 작성자에게 즉시 보여준다.
 *
 * 본문에는 `#단어` 를 그대로 저장하고 링크는 읽는 시점에 만들기 때문에, 에디터 안에서는
 * 태그가 강조되지 않는다. 대신 저장 전에 무엇이 태그로 잡혔는지 여기서 확인시켜
 * "붙였다고 생각한 태그로 검색이 안 되는" 상황을 막는다. 규칙은 서버와 동일하다.
 */
export default function HashtagHints({ content }) {
  const tags = useMemo(() => extractHashtags(content), [content]);

  return (
    <div className="mt-2 text-sm" data-testid="hashtag-hints" aria-live="polite">
      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-600">인식된 해시태그</span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 font-medium text-green-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          본문에 <code>#숲가꾸기</code> 처럼 적으면 해시태그로 등록되어 검색과 모아보기에 쓰입니다.
        </p>
      )}
    </div>
  );
}
