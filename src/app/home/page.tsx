"use client";

import { useEffect } from "react";
interface User {
  name: string;
  age: number;
  info?: number;
}
export default function HomeDashboardPage() {
  useEffect(() => {
    type UserKeys = keyof User;
    let xiaoming: UserKeys = "name";
    type MyPartial = {
      [key in keyof User]?: string;
    };
    type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

    // 测试
    type MyFunc = (x: number) => string;
    type Result = GetReturnType<MyFunc>; // ✅ 结果是 `string`！
  }, []);
  return <div>主页</div>;
}
