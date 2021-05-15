import { FinweckTree } from '../finweck-tree'

describe('finweck tree', () => {
  it('#sum', () => {
    const ft = new FinweckTree(10, 5)
    expect(ft.sum(0)).toEqual(0)
    expect(ft.sum(1)).toEqual(5)
    expect(ft.sum(9)).toEqual(45)
    expect(ft.sum(10)).toEqual(50)
    expect(() => ft.sum(11)).toThrow()
  })
  it('#add', () => {
    const ft = new FinweckTree(10, 5)
    ft.add(0, 1)
    expect(ft.sum(0)).toEqual(0)
    expect(ft.sum(1)).toEqual(6)
    expect(ft.sum(2)).toEqual(11)
    expect(ft.sum(3)).toEqual(16)
    expect(ft.sum(9)).toEqual(46)
    expect(ft.sum(10)).toEqual(51)
    expect(() => ft.sum(11)).toThrow()
  })
  it('#threshold', () => {
    const ft = new FinweckTree(10, 5)
    expect(ft.getBound(-1)).toEqual(0)
    expect(ft.getBound(0)).toEqual(0)
    expect(ft.getBound(9.5)).toEqual(1)
    expect(ft.getBound(10)).toEqual(2)
    expect(ft.getBound(10.5)).toEqual(2)
    expect(ft.getBound(49.5)).toEqual(9)
    expect(ft.getBound(50)).toEqual(10)
    expect(ft.getBound(10000)).toEqual(10)
  })
})
