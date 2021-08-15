+++
title = "Lower Bound and Upper Bound in Rust"
date = 2021-08-16
template = "algorithm.html"

[taxonomies]
tags = [
    "rust",
]
categories = [
    "algorithm",
]
+++

In C++, if you want to find a minimum or maximum element which satisfies some predicate,
you would use `lower_bound`, `upper_bound`, or `equal_range`.
But you cannot find them in the Rust std docs. Where are they?

## `[T]` and `VecDeque`: `partition_point`


`partition_point(&self, pred)` returns the leftmost element which the predicate returns `false`.
It assumes that the data is sorted, so the predicate returns `true` for all the elements
on the left part, and `false` for right.

Set the `pred` as `|&element| element < value`, and you get `lower_bound`,
or as `|&element| element <= value` to get `upper_bound`.

### Example

```rust
let a = [1, 1, 3, 3, 4, 5, 7, 7, 7, 7, 10];

assert_eq!(2, a.partition_point(|&n| n < 3));
assert_eq!(10, a.partition_point(|&n| n <= 7));
```

## `BTreeMap`, `BTreeSet`: `range`

`range(&self, range)` returns a bidirectional iterator which traversesthe elements in `range`
in sorted order. `BTreeMap` and `BTreeSet` stores values in order, therefore you don't
have to manually sort them as in `partition_point`.

### Example

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
