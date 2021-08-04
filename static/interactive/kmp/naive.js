const EqualsKeyframe = [
  { color: 'black' }, { color: 'blue', easing: 'ease-in-out' }, { color: 'black' }
];

const DiffersKeyframe = [
  { color: 'black' }, { color: 'red', easing: 'ease-in-out' }, { color: 'black' }
];

const fontSize = '2rem';

function createNaiveView(container) {
  const $haystack = document.createElement('div');
  $haystack.classList.add('line');

  const $needle = document.createElement('div');
  $needle.classList.add('line');

  container.appendChild($haystack);
  container.appendChild($needle);

  const state = {
    position: 0,

    haystack: '',
    needle: '',
    maxLength: 0,

    animate: null,
    events: new EventTarget(),
  };

  function setHaystack(haystack) {
    state.haystack = haystack;
    // 새로 haystack이 들어왔으니까 다시 계산
    state.maxLength = Math.max(state.haystack.length, state.needle.length);

    // 새로 haystack이 들어왔으니까 처음으로 옮기고
    state.position = 0;
    updateNeedlePosition();
    // animation도 멈춰야 함
    state.events.dispatchEvent(new Event('end'));
    state.animate = null;
    
    updateEntireView();
  }
    
  function setNeedle(needle) {
    state.needle = needle;
    // 새로 needle이 들어왔으니까 다시 계산
    state.maxLength = Math.max(state.haystack.length, state.needle.length);

    // 새로 needle이 들어왔으니까 처음으로 옮기고
    state.position = 0;
    updateNeedlePosition();
    // animation도 멈춰야 함
    state.events.dispatchEvent(new Event('end'));
    state.animate = null;

    updateEntireView();
  }

  function updateEntireView() {
    // haystack이나 needle이 업데이트되면 뷰 전체를 고쳐야 함 (span들)
    [[$haystack, state.haystack], [$needle, state.needle]].forEach(([e, text]) => {
      e.innerHTML = '';
      e.style.gridTemplateColumns = `repeat(${text.length}, 1fr)`;
      e.style.width = `calc(${fontSize} * ${text.length})`;

      for (const c of text) {
        const span = document.createElement('span');
        span.innerText = c;
        e.appendChild(span);
      }
    });
  }

  function updateNeedlePosition() {
    $needle.style.transform = `translateX(calc(100% / ${state.needle.length} * ${state.position}))`;
  }

  function createMovementAnimation(toIndex) {
    return () => {
      state.position = toIndex;
      updateNeedlePosition();

      // 움직였으면 이제 비교해보자
      // 첫 비교니까 0번 인덱스부터 시작!
      return createComparisonAnimation(toIndex, 0);
    };
  }

  function createComparisonAnimation(haystackIndex, needleIndex) {
    return () => {
      // find() 종료
      if (needleIndex >= state.needle.length) {
        state.events.dispatchEvent(new Event('end'));
        return null;
      }

      const targets = [
        $haystack.children.item(haystackIndex),
        $needle.children.item(needleIndex)
      ];

      if (state.haystack[haystackIndex] === state.needle[needleIndex]) {
        targets.forEach((e) => e.animate(EqualsKeyframe, 1000));
        // 같기 때문에 다음도 비교
        return createComparisonAnimation(haystackIndex + 1, needleIndex + 1);
      } else {
        targets.forEach((e) => e.animate(DiffersKeyframe, 1000));
        // 다르기 때문에 한 칸 옮겨봄
        // 이 때, needleIndex가 여태까지 비교한 문자열의 길이와 같으므로,
        // 현재 커서 - 비교한 문자열 + 1이면 비교 시작점 + 1
        const nextIndex = haystackIndex - needleIndex + 1;
        // 근데 만약 nextIndex + needle.length > haystack.length면 더 비교할 수 없으니까 멈춤
        if (nextIndex + state.needle.length > state.haystack.length) {
          state.events.dispatchEvent(new Event('end'));
          return null;
        } else {
          return createMovementAnimation(nextIndex);
        }
      }
    }
  }

  function beginAnimation() {
    state.events.dispatchEvent(new Event('begin'));
    state.animate = createComparisonAnimation(0, 0);
  }

  function pauseAnimation() {
    const stoppedAnimation = state.animate;
    state.events.dispatchEvent(new Event('pause'));
    state.animate = null;

    const resume = () => {
      state.events.dispatchEvent(new Event('resume'));
      state.animate = stoppedAnimation;
    }

    return resume;
  }
  
  function resetAnimation() {
    state.position = 0;
    updateNeedlePosition();
    state.events.dispatchEvent(new Event('end'));
    state.animate = null;
  }

  // 이걸 매 (애니메이션 원하는 시간)마다 실행하면 됨
  const animationLoop = () => {
    if (state.animate) {
      state.animate = state.animate();
      // pause의 경우에도 null
      // if (state.animate === null) {
      //   animationEndListeners.forEach((listen) => {
      //     listen();
      //   });
      // }
    }
  }

  return {
    setHaystack,
    setNeedle,
    animationLoop,
    beginAnimation,
    pauseAnimation,
    resetAnimation,
    events: state.events,
  };
}
