+++
title = "KMP 알고리즘 - 빠른 문자열 검색"
date = 2021-08-04
template = "algorithm.html"

[taxonomies]
tags = [
    "rust",
]
categories = [
    "algorithm",
]
+++

<link rel="stylesheet" href="/kmp.css">

<script>
    const onViewLoad = () => {
        const naiveInteractive = document.getElementById('naive-interactive');
        const naiveInteractiveForm = document.getElementById('naive-interactive-form');
        const naiveInteractiveView = createPlayer(naiveInteractive, naiveInteractiveForm);

        const { haystack, needle } = naiveInteractiveForm;

        haystack.value = "kiwiyou's blog";
        needle.value = "u's";
        naiveInteractiveView.setHaystack(haystack.value);
        naiveInteractiveView.setNeedle(needle.value);

        haystack.addEventListener('change', () => {
            if (/\S/g.test(haystack.value)) {
                naiveInteractiveView.setHaystack(haystack.value);
            }
        });
        needle.addEventListener('change', () => {
            if (/\S/g.test(needle.value)) {
                naiveInteractiveView.setNeedle(needle.value);
            }
        });

        const naiveEdge = document.getElementById('naive-edge');
        const naiveEdgeForm = document.getElementById('naive-edge-form');
        const naiveEdgeView = createPlayer(naiveEdge, naiveEdgeForm);

        naiveEdgeView.setHaystack('AAAAAAAAAAAAB');
        naiveEdgeView.setNeedle('AAAAB');

        function createPlayer(area, form) {
            const view = createNaiveView(area);
            const {
                begin,
                pause,
                resume,
                reset
            } = form;

            setInterval(() => view.animationLoop(), 1000);
            const buttonOrder = [begin, pause, resume, reset];
            const transition = {
                'begin': ['none', null, 'none', null],
                'end': [null, 'none', 'none', null],
                'pause': ['none', 'none', null, null],
                'resume': ['none', null, 'none', null],
            };
            for (const type in transition) {
                view.events.addEventListener(type, () => {
                    buttonOrder.forEach((button, i) => {
                        if (transition[type][i]) {
                            button.style.display = transition[type][i];
                        } else {
                            button.style = '';
                        }
                    })
                })
            }
            begin.addEventListener('click', (e) => {
                e.preventDefault();
                view.beginAnimation();
            });
            let resumeAnimation = null;
            pause.addEventListener('click', (e) => {
                e.preventDefault();
                resumeAnimation = view.pauseAnimation();
            });
            resume.addEventListener('click', (e) => {
                e.preventDefault();
                if (resumeAnimation) {
                    resumeAnimation();
                }
            });
            reset.addEventListener('click', (e) => {
                e.preventDefault();
                view.resetAnimation();
            });
            return view;
        }
    };
</script>

한 문자열에서 다른 문자열이 나타나는 위치를 알려면 어떻게 하면 좋을까요?

찾으려고 하는 문자열을 `needle`, 찾을 바탕이 되는 문자열을 `haystack`이라고 해 보겠습니다.

(a needle in haystack은 "모래사장에서 바늘 찾기"와 통하는 영어 관용구입니다.
문자열을 검색하는 코드 중 이런 변수 이름을 사용하는 코드가 꽤 있습니다.)

문자열을 찾는다는 것은 `haystack[i..i + needle_len] == needle[0..needle_len]`인 `i`를 찾는 것입니다.

가장 간단하게는 가능한 모든 i에 대해서 위 식이 성립하는지를 살펴보는 방법이 있습니다.

참고: 코드의 단순화를 위해 문자열의 자료형은 `str`가 아닌 `[u8]`을 사용하도록 하겠습니다.

```rust
fn find_naive(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    for i in 0..haystack.len() {
        if &haystack[i..i + needle.len()] == needle {
            return Some(i);
        }
    }
    None
}
```

아래는 코드가 작동하는 방식을 확인해볼 수 있는 간단한 앱입니다.
여러 가지 문자열을 넣고 작동 과정을 익혀 보세요.

<div id="naive-interactive"></div>
<form id="naive-interactive-form" action="#">
    <label for="haystack">Haystack</label>
    <input name="haystack">
    <label for="needle">Needle</label>
    <input name="needle">
    <button name="begin">시작</button>
    <button name="pause" style="display: none;">일시정지</button>
    <button name="resume" style="display: none;">재시작</button>
    <button name="reset" style="display: none;">초기화</button>
</form>

이제 다음 예제를 살펴 보겠습니다.

<div id="naive-edge"></div>
<form id="naive-edge-form" action="#">
    <button name="begin">시작</button>
    <button name="pause" style="display: none;">일시정지</button>
    <button name="resume" style="display: none;">재시작</button>
    <button name="reset" style="display: none;">초기화</button>
</form>

이렇게 첫 번째 방식은 찾는 문자열이 원래 문자열과 마지막 한 글자만 다른 경우에
총 $m(n-m+1)$번의 비교를 하게 됩니다. 

여기서 더 최적화할 여지가 있을까요?

새로운 그림을 보겠습니다.

<div class="line" style="grid-template-columns: repeat(6, 1fr); width: calc(2rem * 6)">
    <span>A</span>
    <span>B</span>
    <span style="color: blue">A</span>
    <span style="color: red">B</span>
    <span>A</span>
    <span>C</span>
</div>
<div class="line" style="grid-template-columns: repeat(6, 1fr); width: calc(2rem * 6)">
    <span>A</span>
    <span>B</span>
    <span style="color: blue">A</span>
    <span style="color: red">C</span>
</div>

양 문자열에서 A까지는 똑같은데, 이 A는 찾으려는 문자열(ABAC)의 첫 번째 글자이기도 하기 때문에 우리는 비교가 실패한 이후 **한 칸만** 움직이는 게 아니라 **다음 A가 있는 위치까지** 바로 이동해도 된다는 것을 알고 있습니다.
바로 다음 그림처럼 말입니다.

<div class="line" style="grid-template-columns: repeat(6, 1fr); width: calc(2rem * 6)">
    <span>A</span>
    <span>B</span>
    <span style="color: blue">A</span>
    <span style="color: blue">B</span>
    <span>A</span>
    <span>C</span>
</div>
<div class="line" style="grid-template-columns: repeat(6, 1fr); width: calc(2rem * 6)">
    <span></span>
    <span></span>
    <span style="color: blue">A</span>
    <span style="color: blue">B</span>
    <span>A</span>
    <span>C</span>
</div>

KMP는 바로 이 아이디어를 기반으로 합니다. 비교가 실패했을 경우에 주어진 정보로 빠르게 다음 검색어가 있을 위치로 이동하는 것입니다.

이를 알고리즘으로 구현하기 위해 다음 검색어가 있을 위치가 어떤 규칙을 가지는지 살펴봐야 합니다.

다시 위의 그림을 참고하면, 양 문자열이 다르게 되는(B와 C) 위치의 바로 앞쪽에 있는 문자열(A), 즉 일치하는 부분의 접미사가 `needle`의 접두사(A)가 될 경우 다음 위치에 있을 `needle`(ABAC)의 접두사(A)가 현재 접미사(A)와 일치하게 됩니다.

게다가, 접미사 부분은 다른 부분 앞쪽에 위치하여 이미 검색 대상 문자열과 일치함을 확인했으므로 다시 비교할 필요가 없습니다.

따라서 우리는 `needle[현재 접두사의 길이]`부터 다시 비교를 시작하면 됩니다.

*Special thanks to RanolP*

<script src="/interactive/kmp/naive.js" onload="onViewLoad()"></script>
