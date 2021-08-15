+++
title = "Rust의 이분 탐색"
date = 2021-08-03
template = "algorithm.html"

[taxonomies]
tags = [
    "rust",
]
categories = [
    "algorithm",
]
+++

C++을 통해 알고리즘 문제를 풀 때 이분 탐색을 사용한다면 대개
`lower_bound`나 `upper_bound`, `equal_range`를 통해 조건을 만족하는 최소나 최대를 찾는 경우입니다.

하지만 Rust의 `binary_search`는 찾고자 하는 원소의 정확한 위치만을 반환합니다.

때문에 저는 한동안 Rust의 한계를 느끼고 직접 구현한 `lower_bound`를 사용했습니다.

그런데, 함수명은 다르지만 `lower_bound`와 같은 역할을 수행하는 메서드가 컬렉션마다 존재합니다.

## `[T]`와 `VecDeque`: `partition_point`


`partition_point(&self, pred)`는 배열의 왼쪽에 `pred`를 만족하는 원소가,
오른쪽에 `pred`를 만족하지 않는 원소가 모여 있을 때
`pred`를 만족하지 않는 가장 왼쪽 원소의 위치를 반환합니다.

즉, `pred`를 만족하는 원소가 인덱스 $\left[0, p\right)$를,
그렇지 않은 원소가 $\left[p, \mathrm{len}\right)$에 위치할 때 $p$를 반환합니다.

이때 `pred`를 `|&element| element < value`로 설정하면 `lower_bound`가 되고,
`|&element| element <= value`로 설정하면 `upper_bound`가 됩니다.

### 예제

```rust
let a = [1, 1, 3, 3, 4, 5, 7, 7, 7, 7, 10];

assert_eq!(2, a.partition_point(|&n| n < 3));
assert_eq!(10, a.partition_point(|&n| n <= 7));
```

## `BTreeMap`, `BTreeSet`: `range`

`range(range)`는 주어진 범위 `range`를 탐색할 수 있는 양방향 반복자(iterator)을
반환합니다.

### 예제

```rust
use std::collections::BTreeSet;
use std::ops::Bound::*;

let mut set = BTreeSet::<u32>::new();

set.extend([9, 2, 3, 6, 5, 1].iter());

let range: Vec<u32> = set.range(2..=3).copied().collect();
assert_eq!(vec![2, 3], range);

let bounded: Vec<u32> = set.range((Excluded(&3), Included(&6))).copied().collect();
assert_eq!(vec![5, 6], bounded);

let unbounded: Vec<u32> = set.range((Unbounded, Excluded(&9))).copied().collect();
assert_eq!(vec![1, 2, 3, 5, 6], unbounded);
```
